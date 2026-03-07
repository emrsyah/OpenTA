import { NextResponse } from "next/server";
import { db } from "@/db";
import { feedback } from "@/db/schema/feedback";
import { auth } from "@/lib/auth";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validation constants
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_EMAIL_LENGTH = 255;

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    const body = await req.json();
    const { message, email, path } = body;

    // Validate path
    if (!path || typeof path !== "string") {
      return NextResponse.json(
        { error: "Path is required" },
        { status: 400 },
      );
    }

    // Validate path length
    if (path.length > 512) {
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400 },
      );
    }

    // Validate message
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length < MIN_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be at least ${MIN_MESSAGE_LENGTH} characters` },
        { status: 400 },
      );
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be less than ${MAX_MESSAGE_LENGTH} characters` },
        { status: 400 },
      );
    }

    // Handle email validation
    let userEmail: string | null = null;

    if (session?.user?.email) {
      // Use authenticated user's email
      userEmail = session.user.email;
    } else if (email) {
      // Validate provided email for anonymous users
      if (typeof email !== "string") {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 },
        );
      }

      const trimmedEmail = email.trim();

      if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
        return NextResponse.json(
          { error: "Email is too long" },
          { status: 400 },
        );
      }

      if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
        return NextResponse.json(
          { error: "Please provide a valid email address" },
          { status: 400 },
        );
      }

      userEmail = trimmedEmail || null;
    }

    await db.insert(feedback).values({
      message: trimmedMessage,
      email: userEmail,
      path: path.trim(),
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
