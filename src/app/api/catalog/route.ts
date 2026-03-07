import { and, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { catalog } from "@/db/schema";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const search = searchParams.get("search") || "";
    const catalogType = searchParams.get("type");
    const yearFrom = searchParams.get("yearFrom");
    const yearTo = searchParams.get("yearTo");
    const subject = searchParams.get("subject");
    const editor = searchParams.get("editor");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    // Search across title, author, subject
    if (search) {
      conditions.push(
        or(
          ilike(catalog.title, `%${search}%`),
          ilike(catalog.author, `%${search}%`),
          ilike(catalog.subject, `%${search}%`),
        ),
      );
    }

    // Filter by catalog type
    if (catalogType && catalogType !== "all") {
      conditions.push(eq(catalog.catalogType, catalogType as any));
    }

    // Filter by year range
    if (yearFrom) {
      conditions.push(gte(catalog.publicationYear, parseInt(yearFrom)));
    }
    if (yearTo) {
      conditions.push(lte(catalog.publicationYear, parseInt(yearTo)));
    }

    // Filter by subject
    if (subject) {
      conditions.push(ilike(catalog.subject, `%${subject}%`));
    }

    // Filter by editor (lecturer)
    if (editor) {
      conditions.push(ilike(catalog.editor, `%${editor}%`));
    }

    // Fetch data with filters
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalCount] = await Promise.all([
      db
        .select()
        .from(catalog)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(catalog.publicationYear),
      db
        .select({ count: sql<number>`count(*)` })
        .from(catalog)
        .where(whereClause)
        .then((result) => Number(result[0]?.count || 0)),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Catalog API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalog items" },
      { status: 500 },
    );
  }
}
