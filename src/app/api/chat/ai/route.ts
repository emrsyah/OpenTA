import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { streamAgentResponse } from "@/lib/ai/agent";
import type { ChatFilters } from "@/lib/ai/types";

// Allow long-running research agent streams.
export const maxDuration = 300;

function extractQuery(messages: Array<{ content?: string; parts?: Array<{ type: string; text?: string }> }>): string {
  const lastMessage = messages?.[messages.length - 1];
  if (!lastMessage) return "";

  if (typeof lastMessage.content === "string") {
    return lastMessage.content;
  }

  if (Array.isArray(lastMessage.parts)) {
    return lastMessage.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text || "")
      .join("\n");
  }

  return "";
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to send messages." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { messages, conversationId, filters } = body as {
      messages: Array<{ id: string; role: "user" | "assistant"; content: string; parts?: Array<{ type: string; text?: string }> }>;
      conversationId?: string;
      filters?: ChatFilters;
    };

    const query = extractQuery(messages);

    if (!query) {
      return NextResponse.json(
        { error: "No question found in messages" },
        { status: 400 },
      );
    }

    const language = req.headers.get("Accept-Language")?.split(",")[0] || "id-ID";
    const effectiveIsFirstMessage = conversationId
      ? messages.filter((m) => m.role === "user").length <= 1
      : true;

    // Stream the research agent response directly — no proxy to Python backend
    const stream = await streamAgentResponse({
      question: query,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      conversationId,
      userId: session.user.id,
      language,
      catalogType: filters?.catalogType,
      yearFrom: filters?.yearFrom,
      yearTo: filters?.yearTo,
      author: filters?.author,
      isFirstMessage: effectiveIsFirstMessage,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal Server Error",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
