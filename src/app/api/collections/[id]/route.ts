import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { collections, savedPapers } from "@/db/schema";
import { auth } from "@/lib/auth";

// PATCH /api/collections/[id] - Update a collection
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const collectionId = parseInt(id, 10);

    if (Number.isNaN(collectionId)) {
      return NextResponse.json(
        { error: "Invalid collection ID" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { name, description, color, icon } = body;

    // Build update object
    const updateData: {
      name?: string;
      description?: string | null;
      color?: string | null;
      icon?: string | null;
    } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Collection name cannot be empty" },
          { status: 400 },
        );
      }
      if (name.length > 100) {
        return NextResponse.json(
          { error: "Collection name must be less than 100 characters" },
          { status: 400 },
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (color !== undefined) {
      if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return NextResponse.json(
          { error: "Invalid color format. Use hex format like #3B82F6" },
          { status: 400 },
        );
      }
      updateData.color = color || null;
    }

    if (icon !== undefined) {
      updateData.icon = icon || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    // Update only if belongs to user
    const [updated] = await db
      .update(collections)
      .set(updateData)
      .where(
        and(
          eq(collections.id, collectionId),
          eq(collections.userId, session.user.id),
        ),
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ collection: updated });
  } catch (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json(
      { error: "Failed to update collection" },
      { status: 500 },
    );
  }
}

// DELETE /api/collections/[id] - Delete a collection
// Papers in this collection will be moved to "Uncategorized" (collectionId = null)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const collectionId = parseInt(id, 10);

    if (Number.isNaN(collectionId)) {
      return NextResponse.json(
        { error: "Invalid collection ID" },
        { status: 400 },
      );
    }

    // First, verify collection belongs to user
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

    // Move papers in this collection to uncategorized (set collectionId to null)
    await db
      .update(savedPapers)
      .set({ collectionId: null })
      .where(
        and(
          eq(savedPapers.collectionId, collectionId),
          eq(savedPapers.userId, session.user.id),
        ),
      );

    // Delete the collection
    await db.delete(collections).where(eq(collections.id, collectionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json(
      { error: "Failed to delete collection" },
      { status: 500 },
    );
  }
}
