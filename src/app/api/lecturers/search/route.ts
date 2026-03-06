import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { catalog } from "@/db/schema";
import { calculateLecturerStats, parseEditorField } from "@/lib/lecturer-utils";

// S1 Thesis type constant
const S1_CATALOG_TYPE = "Karya Ilmiah - Skripsi (S1) - Reference";

interface LecturerResult {
  name: string;
  paperCount: number;
  relevanceScore: number;
  stats: {
    totalPapers: number;
    yearRange: { min: number | null; max: number | null };
    subjects: string[];
  };
  topPapers: Array<{
    id: number;
    title: string;
    author: string | null;
    publicationYear: number | null;
    abstract: string | null;
    subject: string | null;
  }>;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const topic = searchParams.get("topic") || "";
    const lecturerName = searchParams.get("name") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const minPapers = parseInt(searchParams.get("minPapers") || "1");

    // Build conditions - always filter for S1 papers only
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

    const whereClause = and(...conditions);

    // Fetch matching papers
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
      .where(whereClause)
      .orderBy(desc(catalog.publicationYear))
      .limit(200); // Fetch more to group by lecturer

    // Group papers by lecturer
    const lecturerMap = new Map<
      string,
      {
        papers: typeof papers;
        relevanceScore: number;
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
          });
        }

        const entry = lecturerMap.get(lecturer)!;
        entry.papers.push(paper);
        // Simple relevance: each paper adds to score
        entry.relevanceScore += 1;
      }
    }

    // Convert to array and filter by minimum papers
    const results: LecturerResult[] = Array.from(lecturerMap.entries())
      .filter(([_, data]) => data.papers.length >= minPapers)
      .map(([name, data]) => {
        const stats = calculateLecturerStats(data.papers);

        return {
          name,
          paperCount: data.papers.length,
          relevanceScore: data.relevanceScore,
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
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return NextResponse.json({
      lecturers: results,
      total: results.length,
      query: { topic, lecturerName },
    });
  } catch (error) {
    console.error("Lecturers search API error:", error);
    return NextResponse.json(
      { error: "Failed to search lecturers" },
      { status: 500 },
    );
  }
}
