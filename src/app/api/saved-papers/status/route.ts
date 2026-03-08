import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { savedPapers } from "@/db/schema";
import { auth } from "@/lib/auth";

// GET /api/saved-papers/status - Check if paper is saved
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user?.id) {
      return NextResponse.json({
        isSaved: false,
        savedPaperId: null,
        collectionIds: [],
      });
    }

    const { searchParams } = new URL(req.url);
    const catalogId = searchParams.get("catalogId");

    if (!catalogId) {
      return NextResponse.json(
        { error: "catalogId is required" },
        { status: 400 },
      );
    }

    const catalogIdNum = parseInt(catalogId, 10);

    if (Number.isNaN(catalogIdNum)) {
      return NextResponse.json({ error: "Invalid catalogId" }, { status: 400 });
    }

    // Find all saved papers for this catalog item by this user
    const saved = await db
      .select({
        id: savedPapers.id,
        collectionId: savedPapers.collectionId,
      })
      .from(savedPapers)
      .where(
        and(
          eq(savedPapers.userId, session.user.id),
          eq(savedPapers.catalogId, catalogIdNum),
        ),
      );

    if (saved.length === 0) {
      return NextResponse.json({
        isSaved: false,
        savedPaperId: null,
        collectionIds: [],
      });
    }

    // Return all collection IDs this paper is saved to
    const collectionIds = saved
      .map((s) => s.collectionId)
      .filter((id): id is number => id !== null);

    return NextResponse.json({
      isSaved: true,
      savedPaperId: saved[0].id, // Return first one for backwards compatibility
      collectionIds,
      savedPaperIds: saved.map((s) => ({
        id: s.id,
        collectionId: s.collectionId,
      })),
    });
  } catch (error) {
    console.error("Error checking save status:", error);
    return NextResponse.json(
      { error: "Failed to check save status" },
      { status: 500 },
    );
  }
}
