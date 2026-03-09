import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { savedPapers } from "@/db/schema";
import { auth } from "@/lib/auth";

// DELETE /api/saved-papers/[id] - Unsave a paper
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
    const savedPaperId = parseInt(id, 10);

    if (Number.isNaN(savedPaperId)) {
      return NextResponse.json(
        { error: "Invalid saved paper ID" },
        { status: 400 },
      );
    }

    // Delete only if belongs to user
    const [deleted] = await db
      .delete(savedPapers)
      .where(
        and(
          eq(savedPapers.id, savedPaperId),
          eq(savedPapers.userId, session.user.id),
        ),
      )
      .returning({ id: savedPapers.id });

    if (!deleted) {
      return NextResponse.json(
        { error: "Saved paper not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unsaving paper:", error);
    return NextResponse.json(
      { error: "Failed to unsave paper" },
      { status: 500 },
    );
  }
}

// PATCH /api/saved-papers/[id] - Update note
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
    const savedPaperId = parseInt(id, 10);

    if (Number.isNaN(savedPaperId)) {
      return NextResponse.json(
        { error: "Invalid saved paper ID" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { note, collectionId } = body;

    // Build update object
    const updateData: { note?: string | null; collectionId?: number | null } =
      {};

    if (note !== undefined) {
      updateData.note = note;
    }

    if (collectionId !== undefined) {
      updateData.collectionId = collectionId;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    // Update only if belongs to user
    const [updated] = await db
      .update(savedPapers)
      .set(updateData)
      .where(
        and(
          eq(savedPapers.id, savedPaperId),
          eq(savedPapers.userId, session.user.id),
        ),
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Saved paper not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ savedPaper: updated });
  } catch (error) {
    console.error("Error updating saved paper:", error);
    return NextResponse.json(
      { error: "Failed to update saved paper" },
      { status: 500 },
    );
  }
}
