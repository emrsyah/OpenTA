import { and, count, desc, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { catalog, collections, savedPapers } from "@/db/schema";
import { auth } from "@/lib/auth";

// GET /api/saved-papers - List user's saved papers
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const collectionId = searchParams.get("collectionId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [eq(savedPapers.userId, session.user.id)];

    if (collectionId) {
      if (collectionId === "uncategorized") {
        conditions.push(isNull(savedPapers.collectionId));
      } else {
        conditions.push(
          eq(savedPapers.collectionId, parseInt(collectionId, 10)),
        );
      }
    }

    // Fetch saved papers with catalog info
    const papers = await db
      .select({
        id: savedPapers.id,
        catalogId: savedPapers.catalogId,
        collectionId: savedPapers.collectionId,
        note: savedPapers.note,
        createdAt: savedPapers.createdAt,
        // Catalog fields
        title: catalog.title,
        author: catalog.author,
        abstract: catalog.abstract,
        publicationYear: catalog.publicationYear,
        catalogType: catalog.catalogType,
        accessLink: catalog.accessLink,
      })
      .from(savedPapers)
      .leftJoin(catalog, eq(savedPapers.catalogId, catalog.id))
      .where(and(...conditions))
      .orderBy(desc(savedPapers.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ total }] = await db
      .select({ total: count() })
      .from(savedPapers)
      .where(and(...conditions));

    return NextResponse.json({
      savedPapers: papers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching saved papers:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved papers" },
      { status: 500 },
    );
  }
}

// POST /api/saved-papers - Save a paper
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { catalogId, collectionId = null, note = null } = body;

    if (!catalogId) {
      return NextResponse.json(
        { error: "catalogId is required" },
        { status: 400 },
      );
    }

    // Check if catalog exists
    const [catalogItem] = await db
      .select({ id: catalog.id })
      .from(catalog)
      .where(eq(catalog.id, catalogId))
      .limit(1);

    if (!catalogItem) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Check if already saved to this collection
    const existingConditions = [
      eq(savedPapers.userId, session.user.id),
      eq(savedPapers.catalogId, catalogId),
    ];

    if (collectionId === null) {
      existingConditions.push(isNull(savedPapers.collectionId));
    } else {
      existingConditions.push(eq(savedPapers.collectionId, collectionId));
    }

    const [existing] = await db
      .select({ id: savedPapers.id })
      .from(savedPapers)
      .where(and(...existingConditions))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        {
          error: "Paper already saved to this collection",
          savedPaperId: existing.id,
        },
        { status: 409 },
      );
    }

    // If collectionId provided, verify it belongs to user
    if (collectionId !== null) {
      const [collection] = await db
        .select({ id: collections.id })
        .from(collections)
        .where(
          and(
            eq(collections.id, collectionId),
            eq(collections.userId, session.user.id),
          ),
        )
        .limit(1);

      if (!collection) {
        return NextResponse.json(
          { error: "Collection not found" },
          { status: 404 },
        );
      }
    }

    // Save the paper
    const [savedPaper] = await db
      .insert(savedPapers)
      .values({
        userId: session.user.id,
        catalogId,
        collectionId,
        note,
      })
      .returning();

    return NextResponse.json({ savedPaper }, { status: 201 });
  } catch (error) {
    console.error("Error saving paper:", error);
    return NextResponse.json(
      { error: "Failed to save paper" },
      { status: 500 },
    );
  }
}
