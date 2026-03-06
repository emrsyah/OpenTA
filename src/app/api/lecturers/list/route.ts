import { and, eq, ilike, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { catalog } from "@/db/schema";
import { parseEditorField } from "@/lib/lecturer-utils";

// S1 Thesis type constant
const S1_CATALOG_TYPE = "Karya Ilmiah - Skripsi (S1) - Reference";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // Build where conditions
    const conditions = [
      eq(catalog.catalogType, S1_CATALOG_TYPE),
      sql`${catalog.editor} IS NOT NULL`,
    ];

    // Add search filter if provided
    if (search) {
      conditions.push(ilike(catalog.editor, `%${search}%`));
    }

    // Fetch editors from S1 papers
    const results = await db
      .select({
        editor: catalog.editor,
      })
      .from(catalog)
      .where(and(...conditions));

    // Extract and deduplicate lecturer names
    const lecturers = new Map<string, { name: string; paperCount: number }>();

    for (const row of results) {
      if (row.editor) {
        const names = parseEditorField(row.editor);
        for (const name of names) {
          if (lecturers.has(name)) {
            const existing = lecturers.get(name);
            if (existing) {
              existing.paperCount += 1;
            }
          } else {
            lecturers.set(name, { name, paperCount: 1 });
          }
        }
      }
    }

    // Convert to array, sort by name, and limit
    const lecturerList = Array.from(lecturers.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit);

    return NextResponse.json({
      lecturers: lecturerList,
      total: lecturerList.length,
    });
  } catch (error) {
    console.error("Lecturers list API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lecturers list" },
      { status: 500 },
    );
  }
}
