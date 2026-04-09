/**
 * Paper Retriever — vector + keyword search against the Telkom University catalog.
 *
 * Ported from backend/app/services/retriever.py → PaperRetriever.
 * Uses existing src/lib/voyage.ts for embeddings and Drizzle ORM for DB queries.
 */

import { and, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { catalog } from "@/db/schema/catalog";
import { embedQuery, isVoyageConfigured } from "@/lib/voyage";
import type { PaperResult, SearchOptions } from "./types";

interface CatalogRowLike {
  id: number;
  title: string;
  author: string | null;
  abstract: string | null;
  subject: string | null;
  publicationYear: number | null;
  catalogType: string | null;
}

/**
 * Convert a database catalog row to a PaperResult.
 */
function catalogToPaper(row: CatalogRowLike, relevanceScore: number = 0): PaperResult {
  const abstract = row.abstract || row.subject || "No abstract available";
  return {
    id: `catalog_${row.id}`,
    title: row.title,
    authors: row.author ? row.author.split(", ").filter(Boolean) : ["Unknown"],
    abstract,
    year: row.publicationYear || 0,
    keywords: row.catalogType ? [row.catalogType] : [],
    relevanceScore,
  };
}

/**
 * Search papers using pgvector cosine similarity.
 * Falls back to keyword search if Voyage AI is not configured.
 */
export async function searchPapers(query: string, opts?: SearchOptions): Promise<PaperResult[]> {
  const limit = Math.max(1, Math.min(opts?.limit || 5, 10));
  const conditions = [];

  // Apply filters
  if (opts?.catalogType) {
    conditions.push(eq(catalog.catalogType, opts.catalogType as any));
  }
  if (opts?.yearFrom) {
    conditions.push(gte(catalog.publicationYear, opts.yearFrom));
  }
  if (opts?.yearTo) {
    conditions.push(lte(catalog.publicationYear, opts.yearTo));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // ── Vector search path ──────────────────────────────────────────────
  if (isVoyageConfigured()) {
    try {
      const embedding = await embedQuery(query);
      const embeddingStr = `[${embedding.join(",")}]`;

      // pgvector cosine similarity search
      // 1 - (embedding <=> $1) gives similarity score (1 = identical)
      const vectorResults = await db
        .select({
          id: catalog.id,
          title: catalog.title,
          author: catalog.author,
          abstract: catalog.abstract,
          subject: catalog.subject,
          publicationYear: catalog.publicationYear,
          catalogType: catalog.catalogType,
          similarity: sql<number>`1 - (embedding <=> ${embeddingStr}::vector)`,
        })
        .from(catalog)
        .where(
          and(
            whereClause,
            sql`embedding IS NOT NULL`,
          ),
        )
        .orderBy(sql`embedding <=> ${embeddingStr}::vector`)
        .limit(limit);

      if (vectorResults.length > 0) {
        return vectorResults.map((row) =>
          catalogToPaper(row, Number(row.similarity)),
        );
      }

      // Vector search returned 0 results — fall through to keyword search
    } catch (error) {
      console.error("[RETRIEVER] Vector search failed, falling back to keyword:", error);
    }
  }

  // ── Keyword fallback ───────────────────────────────────────────────
  return keywordSearch(query, limit, whereClause);
}

/**
 * Keyword search using ILIKE on title, author, and subject.
 */
async function keywordSearch(
  query: string,
  limit: number,
  whereClause?: ReturnType<typeof and>,
): Promise<PaperResult[]> {
  const keywordConditions = [
    or(
      ilike(catalog.title, `%${query}%`),
      ilike(catalog.author, `%${query}%`),
      ilike(catalog.subject, `%${query}%`),
    ),
  ];

  const finalWhere = whereClause
    ? and(whereClause, ...keywordConditions)
    : and(...keywordConditions);

  const results = await db
    .select()
    .from(catalog)
    .where(finalWhere)
    .limit(limit);

  // Score keyword results by simple text match heuristic
  return results.map((row) => {
    const queryLower = query.toLowerCase();
    let score = 0;
    if (row.title?.toLowerCase().includes(queryLower)) score += 1.0;
    if (row.subject?.toLowerCase().includes(queryLower)) score += 0.5;
    if (row.author?.toLowerCase().includes(queryLower)) score += 0.3;
    return catalogToPaper(row, score);
  });
}

/**
 * Get a formatted context string for RAG, along with the paper objects.
 * Used by the retriever when building context for answer generation.
 */
export async function getPapersWithContext(
  query: string,
  topK: number = 5,
  paperOffset: number = 0,
  opts?: SearchOptions,
): Promise<{ context: string; papers: PaperResult[] }> {
  const papers = await searchPapers(query, { ...opts, limit: topK });

  if (papers.length === 0) {
    return { context: "No relevant papers found in the catalog.", papers: [] };
  }

  const contextParts = papers.map((paper, i) => {
    const num = i + 1 + paperOffset;
    return [
      `Paper ${num} (ID: ${paper.id})`,
      `Title: ${paper.title}`,
      `Authors: ${paper.authors.join(", ")}`,
      `Year: ${paper.year}`,
      `Abstract: ${paper.abstract}`,
    ].join("\n");
  });

  return {
    context: contextParts.join("\n---\n"),
    papers,
  };
}

/**
 * Get a single paper by its database ID.
 * Accepts both "catalog_123" and "123" formats.
 */
export async function getPaperById(paperId: string): Promise<PaperResult | null> {
  const numericId = paperId.replace(/^catalog_/, "");
  const id = Number.parseInt(numericId, 10);
  if (Number.isNaN(id)) return null;

  const results = await db
    .select()
    .from(catalog)
    .where(eq(catalog.id, id))
    .limit(1);

  if (results.length === 0) return null;
  return catalogToPaper(results[0], 1.0);
}

/**
 * Get full metadata for multiple papers by their database IDs.
 */
export async function getPapersByIds(paperIds: number[]): Promise<PaperResult[]> {
  if (paperIds.length === 0) return [];

  // Batch fetch — pg supports IN clause
  const results = await db
    .select()
    .from(catalog)
    .where(sql`id = ANY(${paperIds})`);

  return results.map((row) => catalogToPaper(row, 1.0));
}
