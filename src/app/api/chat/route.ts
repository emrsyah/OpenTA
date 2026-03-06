import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateBackendToken } from "@/lib/auth/backend-jwt";

// Allow streaming responses up to 300 seconds (complex research queries can take 60s+)
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    // Verify authentication on server side
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to send messages." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { messages, conversationId, model, webSearch, filters } = body;

    // Get the last user message
    const lastMessage = messages?.[messages.length - 1];

    // Extract content from either string 'content' or 'parts' array
    let query = "";
    if (lastMessage) {
      if (typeof lastMessage.content === "string") {
        query = lastMessage.content;
      } else if (Array.isArray(lastMessage.parts)) {
        query = lastMessage.parts
          .filter((part: any) => part.type === "text")
          .map((part: any) => part.text)
          .join("\n");
      }
    }

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

    // Extract optional parameters
    const language =
      req.headers.get("Accept-Language")?.split(",")[0] || "id-ID";
    const timezone = req.headers.get("X-Timezone") || "Asia/Jakarta";
    const sourcePreference = webSearch ? "all" : "only_papers";
    // Generate JWT for backend authentication
    const backendToken = await generateBackendToken({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    });

    // Proxy the request to the backend agent with JWT authentication
    const response = await fetch(`${backendUrl}/chat/basic`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${backendToken}`, // JWT for user verification
      },
      body: JSON.stringify({
        query,
        meta_params: {
          mode: "basic",
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
          ...(filters?.hasElectronicAccess !== undefined && { has_electronic_access: filters.hasElectronicAccess }),
          // Note: user_id is extracted from JWT by Python backend, not sent in body
        },
      }),
    });

    if (!response.ok) {
      try {
        const errorText = await response.text();
        console.error("Backend error body:", errorText);
      } catch (e) {
        // Ignore JSON parse error for error body
      }
      return NextResponse.json(
        { error: `Backend returned ${response.status}` },
        { status: response.status },
      );
    }

    if (!response.body) {
      return NextResponse.json(
        { error: "No response body from backend" },
        { status: 500 },
      );
    }

    // Set up parsing for the backend SSE stream
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        let buffer = "";

        try {
          let hasTokens = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine || !trimmedLine.startsWith("data:")) continue;

              const data = trimmedLine.slice(5).trim();
              if (data === "[DONE]") {
                controller.enqueue(
                  encoder.encode(JSON.stringify({ type: "finish" }) + "\n"),
                );
                continue;
              }

              try {
                const parsed = JSON.parse(data);

                if (parsed.type === "simple_thinking") {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "simple_thinking",
                        message: parsed.message,
                      }) + "\n",
                    ),
                  );
                } else if (parsed.type === "acknowledgment") {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "acknowledgment",
                        content: parsed.content,
                      }) + "\n",
                    ),
                  );
                } else if (parsed.type === "status") {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "status",
                        step: parsed.step,
                        message: parsed.message,
                      }) + "\n",
                    ),
                  );
                } else if (parsed.type === "plan") {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({ type: "plan", steps: parsed.steps }) +
                      "\n",
                    ),
                  );
                } else if (parsed.type === "step_start") {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "step_start",
                        step_id: parsed.step_id,
                        title: parsed.title,
                        description: parsed.description,
                      }) + "\n",
                    ),
                  );
                } else if (parsed.type === "step_action") {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "step_action",
                        step_id: parsed.step_id,
                        action: parsed.action,
                        ...(parsed.action === "reformulated_query" ? {
                          original_query: parsed.original_query,
                          query: parsed.query,
                          paper_count: parsed.paper_count,
                        } : {
                          query: parsed.query,
                        }),
                      }) + "\n",
                    ),
                  );
                } else if (parsed.type === "step_action_result") {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "step_action_result",
                        step_id: parsed.step_id,
                        action: parsed.action,
                        paper_count: parsed.paper_count,
                      }) + "\n",
                    ),
                  );
                } else if (parsed.type === "step_thinking") {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "step_thinking",
                        step_id: parsed.step_id,
                        content: parsed.content,
                      }) + "\n",
                    ),
                  );
                } else if (parsed.type === "step_done") {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "step_done",
                        step_id: parsed.step_id,
                      }) + "\n",
                    ),
                  );
                } else if (parsed.type === "thinking_start") {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({ type: "thinking_start" }) + "\n",
                    ),
                  );
                } else if (parsed.type === "thinking_token" && parsed.content) {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "thinking_token",
                        content: parsed.content,
                      }) + "\n",
                    ),
                  );
                } else if (parsed.type === "thinking_end") {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({ type: "thinking_end" }) + "\n",
                    ),
                  );
                } else if (parsed.type === "answer_start") {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({ type: "answer_start" }) + "\n",
                    ),
                  );
                } else if (parsed.type === "search_query" && parsed.query) {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "search_query",
                        query: parsed.query,
                      }) + "\n",
                    ),
                  );
                } else if (parsed.type === "token" && parsed.content) {
                  hasTokens = true;
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "text",
                        content: parsed.content,
                      }) + "\n",
                    ),
                  );
                } else if (parsed.type === "rationale" && parsed.content) {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "rationale",
                        content: parsed.content,
                      }) + "\n",
                    ),
                  );
                } else if (parsed.type === "done") {
                  if (!hasTokens && parsed.content) {
                    controller.enqueue(
                      encoder.encode(
                        JSON.stringify({
                          type: "text",
                          content: parsed.content,
                        }) + "\n",
                      ),
                    );
                  }
                  if (parsed.sources?.length) {
                    controller.enqueue(
                      encoder.encode(
                        JSON.stringify({
                          type: "sources",
                          data: parsed.sources,
                        }) + "\n",
                      ),
                    );
                  }
                  // Signal completion so the FE can update sidebar
                  controller.enqueue(
                    encoder.encode(JSON.stringify({ type: "done" }) + "\n"),
                  );
                } else if (parsed.type === "title") {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "title",
                        content: parsed.content,
                      }) + "\n",
                    ),
                  );
                } else if (parsed.type === "citation_audit") {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "citation_audit",
                        is_clean: parsed.is_clean,
                        hallucinated_citation_numbers: parsed.hallucinated_citation_numbers,
                        total_citations_in_answer: parsed.total_citations_in_answer,
                        total_papers_available: parsed.total_papers_available,
                      }) + "\n",
                    ),
                  );
                } else if (parsed.type === "refinement_start") {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "refinement_start",
                        gap_query: parsed.gap_query,
                      }) + "\n",
                    ),
                  );
                } else if (parsed.type === "refinement_search") {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "refinement_search",
                        paper_count: parsed.paper_count,
                      }) + "\n",
                    ),
                  );
                } else if (parsed.type === "refinement_token") {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "refinement_token",
                        content: parsed.content,
                      }) + "\n",
                    ),
                  );
                } else if (parsed.type === "refinement_done") {
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "refinement_done",
                        content: parsed.content,
                        sources: parsed.sources,
                      }) + "\n",
                    ),
                  );
                } else if (parsed.type === "error") {
                  console.error("Backend stream error:", parsed.content);
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "error",
                        content: parsed.content,
                      }) + "\n",
                    ),
                  );
                }
              } catch (e) {
                // Not JSON, skip
              }
            }
          }
        } catch (err) {
          console.error("Streaming error:", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(transformStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("API Route error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
