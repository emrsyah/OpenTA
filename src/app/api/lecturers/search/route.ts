import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { catalog } from "@/db/schema";
import { calculateLecturerStats, parseEditorField } from "@/lib/lecturer-utils";
import { embedQuery, isVoyageConfigured } from "@/lib/voyage";

// S1 Thesis type constant
const S1_CATALOG_TYPE = "Karya Ilmiah - Skripsi (S1) - Reference";

import { LecturerResult } from "@/types/lecturer";

// Vector similarity threshold (lower = more similar)
const SIMILARITY_THRESHOLD = 0.5;

interface PaperResult {
  id: number;
  title: string;
  author: string | null;
  editor: string | null;
  publicationYear: number | null;
  abstract: string | null;
  subject: string | null;
  similarity?: number;
}

/**
 * Perform vector similarity search using pgvector
 */
async function vectorSearch(
  topic: string,
  lecturerName: string | null,
): Promise<{ papers: PaperResult[]; method: "vector" }> {
  // Embed the query
  const queryEmbedding = await embedQuery(topic);
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  // Build conditions
  const conditions = [
    eq(catalog.catalogType, S1_CATALOG_TYPE),
    sql`${catalog.editor} IS NOT NULL`,
    sql`${catalog.embedding} IS NOT NULL`,
  ];

  if (lecturerName) {
    const escapedName = lecturerName.replace(/[%_]/g, '\\$&');
    conditions.push(ilike(catalog.editor, `%${escapedName}%`));
  }

  // Vector similarity search using cosine distance (<=>)
  const papers = await db
    .select({
      id: catalog.id,
      title: catalog.title,
      author: catalog.author,
      editor: catalog.editor,
      publicationYear: catalog.publicationYear,
      abstract: catalog.abstract,
      subject: catalog.subject,
      similarity: sql<number>`1 - (${catalog.embedding} <=> ${embeddingStr}::vector)`,
    })
    .from(catalog)
    .where(and(...conditions))
    .orderBy(sql`${catalog.embedding} <=> ${embeddingStr}::vector`)
    .limit(200);

  return { papers, method: "vector" };
}

/**
 * Perform full-text search using PostgreSQL tsvector
 * Fallback when vector search is unavailable
 */
async function fullTextSearch(
  topic: string,
  lecturerName: string | null,
): Promise<{ papers: PaperResult[]; method: "fulltext" }> {
  const conditions = [eq(catalog.catalogType, S1_CATALOG_TYPE)];

  // Search by topic (across title, abstract, subject)
  if (topic) {
    conditions.push(
      sql`(
        to_tsvector('indonesian', COALESCE(${catalog.title}, '')) ||
        to_tsvector('indonesian', COALESCE(${catalog.abstract}, '')) ||
        to_tsvector('indonesian', COALESCE(${catalog.subject}, ''))
      ) @@ plainto_tsquery('indonesian', ${topic})`,
    );
  }

  // Search by lecturer name (in editor field)
  if (lecturerName) {
    conditions.push(ilike(catalog.editor, `%${lecturerName}%`));
  }

  // Ensure editor is not null
  conditions.push(sql`${catalog.editor} IS NOT NULL`);

  const papers = await db
    .select({
      id: catalog.id,
      title: catalog.title,
      author: catalog.author,
      editor: catalog.editor,
      publicationYear: catalog.publicationYear,
      abstract: catalog.abstract,
      subject: catalog.subject,
    })
    .from(catalog)
    .where(and(...conditions))
    .orderBy(desc(catalog.publicationYear))
    .limit(200);

  return { papers, method: "fulltext" };
}

/**
 * Group papers by lecturer and calculate relevance
 */
function groupPapersByLecturer(
  papers: PaperResult[],
  minPapers: number,
  searchMethod: "vector" | "fulltext",
): LecturerResult[] {
  const lecturerMap = new Map<
    string,
    {
      papers: PaperResult[];
      relevanceScore: number;
      avgSimilarity: number;
    }
  >();

  for (const paper of papers) {
    if (!paper.editor) continue;

    const lecturers = parseEditorField(paper.editor);

    for (const lecturer of lecturers) {
      if (!lecturerMap.has(lecturer)) {
        lecturerMap.set(lecturer, {
          papers: [],
          relevanceScore: 0,
          avgSimilarity: 0,
        });
      }

      const entry = lecturerMap.get(lecturer)!;
      entry.papers.push(paper);

      // For vector search, use similarity score
      // For fulltext, count papers
      if (searchMethod === "vector" && paper.similarity !== undefined) {
        entry.relevanceScore += paper.similarity;
        entry.avgSimilarity = entry.relevanceScore / entry.papers.length;
      } else {
        entry.relevanceScore += 1;
      }
    }
  }

  // Convert to array and filter by minimum papers
  return Array.from(lecturerMap.entries())
    .filter(([_, data]) => data.papers.length >= minPapers)
    .map(([name, data]) => {
      const stats = calculateLecturerStats(data.papers);

      return {
        name,
        paperCount: data.papers.length,
        relevanceScore: searchMethod === "vector" ? data.avgSimilarity : data.relevanceScore,
        searchMethod,
        stats,
        topPapers: data.papers.slice(0, 3).map((p) => ({
          id: p.id,
          title: p.title,
          author: p.author,
          publicationYear: p.publicationYear,
          abstract: p.abstract ? p.abstract.slice(0, 200) + "..." : null,
          subject: p.subject,
        })),
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const topic = searchParams.get("topic") || "";
    const lecturerName = searchParams.get("name") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const minPapers = parseInt(searchParams.get("minPapers") || "1");
    const searchMode = (searchParams.get("searchMode") || "keyword") as "semantic" | "keyword";

    let papers: PaperResult[];
    let searchMethod: "vector" | "fulltext";

    // Determine which search method to use based on user selection
    const shouldUseVector = searchMode === "semantic" && isVoyageConfigured() && topic;

    if (shouldUseVector) {
      try {
        console.log("[Search] Attempting semantic search for:", topic);
        const result = await vectorSearch(topic, lecturerName || null);

        // Filter by similarity threshold
        const filteredPapers = result.papers.filter(
          (p) =>
            p.similarity !== undefined && p.similarity > SIMILARITY_THRESHOLD,
        );

        console.log(
          `[Search] Semantic search found ${filteredPapers.length} papers`,
        );
        papers = filteredPapers.length > 0 ? filteredPapers : result.papers;
        searchMethod = "vector";
      } catch (error) {
        console.error("[Search] Semantic search failed:", error);
        throw new Error("Semantic search failed. Please try keyword search.");
      }
    } else {
      // Use keyword search
      console.log("[Search] Using keyword search");
      const result = await fullTextSearch(topic, lecturerName || null);
      papers = result.papers;
      searchMethod = result.method;
    }

    // Group papers by lecturer
    const results = groupPapersByLecturer(
      papers,
      minPapers,
      searchMethod,
    ).slice(0, limit);

    return NextResponse.json({
      lecturers: results,
      total: results.length,
      query: { topic, lecturerName },
      searchMethod,
    });
  } catch (error) {
    console.error("Lecturers search API error:", error);
    return NextResponse.json(
      { error: "Failed to search lecturers" },
      { status: 500 },
    );
  }
}
