import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { catalog } from "@/db/schema";
import { calculateLecturerStats, parseEditorField } from "@/lib/lecturer-utils";

// S1 Thesis type constant
const S1_CATALOG_TYPE = "Karya Ilmiah - Skripsi (S1) - Reference";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const name = searchParams.get("name");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    if (!name) {
      return NextResponse.json(
        { error: "Lecturer name is required" },
        { status: 400 },
      );
    }

    // Fetch all papers by this lecturer (S1 only)
    const whereClause = and(
      eq(catalog.catalogType, S1_CATALOG_TYPE),
      ilike(catalog.editor, `%${name}%`),
      sql`${catalog.editor} IS NOT NULL`,
    );

    // Get all papers for this lecturer to calculate accurate stats (fetching only necessary columns)
    const allPapers = await db
      .select({
        publicationYear: catalog.publicationYear,
        subject: catalog.subject,
        editor: catalog.editor,
      })
      .from(catalog)
      .where(whereClause);

    const totalCount = allPapers.length;

    // Get papers with pagination for the actual list
    const papers = await db
      .select({
        id: catalog.id,
        title: catalog.title,
        author: catalog.author,
        editor: catalog.editor,
        publicationYear: catalog.publicationYear,
        abstract: catalog.abstract,
        subject: catalog.subject,
        catalogNumber: catalog.catalogNumber,
        classificationNumber: catalog.classificationNumber,
        publisher: catalog.publisher,
        accessLink: catalog.accessLink,
      })
      .from(catalog)
      .where(whereClause)
      .orderBy(desc(catalog.publicationYear))
      .limit(limit)
      .offset(offset);

    // Calculate stats across ALL papers
    const stats = calculateLecturerStats(allPapers);

    // Extract unique co-lecturers across ALL papers
    const coLecturers = new Set<string>();
    for (const paper of allPapers) {
      if (paper.editor) {
        const editors = parseEditorField(paper.editor);
        for (const editor of editors) {
          if (editor.toLowerCase() !== name.toLowerCase()) {
            coLecturers.add(editor);
          }
        }
      }
    }

    return NextResponse.json({
      lecturer: {
        name,
        stats: {
          ...stats,
          coLecturers: Array.from(coLecturers).slice(0, 10),
        },
        papers: papers.map((p) => ({
          ...p,
          abstract: p.abstract
            ? p.abstract.slice(0, 300) + (p.abstract.length > 300 ? "..." : "")
            : null,
        })),
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Lecturer detail API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lecturer details" },
      { status: 500 },
    );
  }
}
