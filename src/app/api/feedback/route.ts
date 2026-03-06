import { NextResponse } from "next/server";
import { db } from "@/db";
import { feedback } from "@/db/schema/feedback";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    const body = await req.json();
    const { message, email, path } = body;

    if (!message || message.trim().length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters" },
        { status: 400 },
      );
    }

    if (!path) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    // Use user's email if logged in, otherwise use provided email or null
    const userEmail = session?.user?.email || email || null;

    await db.insert(feedback).values({
      message: message.trim(),
      email: userEmail,
      path,
      userId: session?.user?.id || null,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 },
    );
  }
}
