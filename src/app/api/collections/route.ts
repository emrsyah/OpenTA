import { count, desc, eq, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { collections, savedPapers } from "@/db/schema";
import { auth } from "@/lib/auth";

// GET /api/collections - List user's collections with paper counts
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all collections with paper counts
    const userCollections = await db
      .select({
        id: collections.id,
        name: collections.name,
        description: collections.description,
        color: collections.color,
        icon: collections.icon,
        isDefault: collections.isDefault,
        createdAt: collections.createdAt,
        paperCount: sql<number>`count(distinct ${savedPapers.id})`.as(
          "paper_count",
        ),
      })
      .from(collections)
      .leftJoin(savedPapers, eq(collections.id, savedPapers.collectionId))
      .where(eq(collections.userId, session.user.id))
      .groupBy(collections.id)
      .orderBy(desc(collections.createdAt));

    // Get count for uncategorized papers
    const [{ uncategorizedCount }] = await db
      .select({ uncategorizedCount: count() })
      .from(savedPapers)
      .where(
        and(
          eq(savedPapers.userId, session.user.id),
          isNull(savedPapers.collectionId),
        ),
      );

    return NextResponse.json({
      collections: userCollections,
      uncategorizedCount,
    });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 },
    );
  }
}

// Import and for the uncategorized count query
import { and } from "drizzle-orm";

// POST /api/collections - Create a new collection
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, color, icon } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Collection name is required" },
        { status: 400 },
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Collection name must be less than 100 characters" },
        { status: 400 },
      );
    }

    // Validate color format if provided
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json(
        { error: "Invalid color format. Use hex format like #3B82F6" },
        { status: 400 },
      );
    }

    // Create collection
    const [collection] = await db
      .insert(collections)
      .values({
        userId: session.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || null,
        icon: icon || null,
      })
      .returning();

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 },
    );
  }
}
