import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateBackendToken } from "@/lib/auth/backend-jwt";

// Allow long-running DeepAgents streams.
export const maxDuration = 300;

type ParsedEvent = Record<string, unknown> & { type?: string };

function extractQueryFromMessages(messages: any[]): string {
  const lastMessage = messages?.[messages.length - 1];
  if (!lastMessage) return "";

  if (typeof lastMessage.content === "string") {
    return lastMessage.content;
  }

  if (Array.isArray(lastMessage.parts)) {
    return lastMessage.parts
      .filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("\n");
  }

  return "";
}

function serializeEvent(event: ParsedEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
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
    const { messages, conversationId, webSearch, filters } = body;
    const query = extractQueryFromMessages(messages);

    if (!query) {
      return NextResponse.json(
        { error: "No question found in messages" },
        { status: 400 },
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_BACKEND_URL is not defined" },
        { status: 500 },
      );
    }

    const language =
      req.headers.get("Accept-Language")?.split(",")[0] || "id-ID";
    const timezone = req.headers.get("X-Timezone") || "Asia/Jakarta";
    const sourcePreference = webSearch ? "all" : "only_papers";

    const backendToken = await generateBackendToken({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    });

    const response = await fetch(`${backendUrl}/agent/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${backendToken}`,
      },
      body: JSON.stringify({
        query,
        meta_params: {
          mode: "ai",
          stream: true,
          language,
          timezone,
          source_preference: sourcePreference,
          conversation_id: conversationId,
          is_incognito: false,
          attachments: [],
          ...(filters?.catalogType && { catalog_type: filters.catalogType }),
          ...(filters?.yearFrom && { year_from: filters.yearFrom }),
          ...(filters?.yearTo && { year_to: filters.yearTo }),
          ...(filters?.author && { author: filters.author }),
          ...(filters?.hasElectronicAccess !== undefined && {
            has_electronic_access: filters.hasElectronicAccess,
          }),
        },
      }),
    });

    if (!response.ok) {
      let detail = "";
      try {
        detail = await response.text();
      } catch {
        // Ignore response body parse errors.
      }
      return NextResponse.json(
        {
          error: `Backend returned ${response.status}`,
          ...(detail ? { detail } : {}),
        },
        { status: response.status },
      );
    }

    if (!response.body) {
      return NextResponse.json(
        { error: "No response body from backend" },
        { status: 500 },
      );
    }

    // Forward the rich DeepAgents activity feed as NDJSON.
    // Every backend SSE event is parsed and forwarded with minimal
    // transformation so the frontend gets the full Manus-like stream.
    const decoder = new TextDecoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data:")) continue;

              const payload = trimmed.slice(5).trim();
              if (payload === "[DONE]") {
                controller.enqueue(serializeEvent({ type: "finish" }));
                continue;
              }

              try {
                const parsed = JSON.parse(payload) as ParsedEvent;

                // Normalise main-agent answer tokens to "answer_token" type
                // so the frontend has a single consistent event to handle.
                if (parsed.type === "token" && !parsed.is_subagent) {
                  controller.enqueue(
                    serializeEvent({
                      type: "answer_token",
                      content: parsed.content,
                    }),
                  );
                  continue;
                }

                // Forward everything else as-is. The backend now emits
                // granular events (tool_call_start, tool_call_args,
                // tool_call_done, search_result, subagent_spawn, etc.)
                // that the frontend activity feed consumes directly.
                controller.enqueue(serializeEvent(parsed));
              } catch {
                // Ignore malformed chunks and continue streaming.
              }
            }
          }
        } catch (error) {
          controller.enqueue(
            serializeEvent({
              type: "error",
              content: error instanceof Error ? error.message : String(error),
            }),
          );
        } finally {
          controller.close();
        }
      },
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
