/**
 * ResearchAgent — Vercel AI SDK powered research assistant.
 *
 * Replaces the Python LangChain ResearchAgent (backend/app/services/agents.py).
 * Uses streamText() with 3 tools and emits the exact SSE event format
 * that use-streaming-chat.ts already consumes — zero frontend changes needed.
 *
 * Key design decisions:
 * - OpenRouter via @ai-sdk/openai (OpenAI-compatible API)
 * - streamText() with stopWhen: isStepCount() for multi-step tool calling
 * - Custom stream transformation to emit Manus-like activity feed events
 * - Post-stream: citation audit, title generation, DB persistence
 */

import { type ModelMessage, generateText, stepCountIs, streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { SYSTEM_PROMPT } from "./prompts/system";
import { researchTools } from "./tools";
import { formatSSE, formatFinish, formatKeepalive } from "./stream";
import { auditCitations } from "./citation-audit";
import { getSessionMemory } from "./session-memory";
import type { CitedPaper, StreamChatOptions } from "./types";

// ── OpenRouter provider ──────────────────────────────────────────────

function getModel() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Add it to your .env file.",
    );
  }
  const openrouter = createOpenRouter({ apiKey });
  const modelId = process.env.AGENT_MODEL || "google/gemini-2.5-flash";
  return openrouter(modelId);
}

// ── Helper: truncate string ──────────────────────────────────────────

function truncate(s: string, maxLen: number = 200): string {
  return s.length <= maxLen ? s : `${s.slice(0, maxLen)}…`;
}

// ── Helper: safe JSON parse ──────────────────────────────────────────

function safeJsonParse(raw: unknown): Record<string, unknown> | null {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object" && raw !== null) {
    return raw as Record<string, unknown>;
  }
  return null;
}

// ── Local type for collected tool results ────────────────────────────

interface ToolResultLike {
  type: "tool-result";
  toolName: string;
  toolCallId: string;
  input: unknown;
  output: unknown;
}

// ── Helper: extract sources from tool results ────────────────────────

function extractSources(toolResults: ToolResultLike[]): CitedPaper[] {
  const seen = new Map<string, CitedPaper>();
  let counter = 1;

  for (const result of toolResults) {
    if (result.type !== "tool-result") continue;

    // Only extract from search_papers tool results
    if (result.toolName !== "search_papers") continue;

    const parsed = safeJsonParse(result.output);
    if (!parsed || !Array.isArray(parsed.papers)) continue;

    for (const paper of parsed.papers) {
      const pid = String((paper as Record<string, unknown>).id ?? "");
      if (!pid || seen.has(pid)) continue;

      const authors = (paper as Record<string, unknown>).authors;
      seen.set(pid, {
        id: pid,
        title: String((paper as Record<string, unknown>).title ?? ""),
        authors: Array.isArray(authors) ? authors.map(String) : [String(authors)],
        abstract: String((paper as Record<string, unknown>).abstract ?? ""),
        year: Number((paper as Record<string, unknown>).year) || 0,
        citation_number: counter++,
      });
    }
  }

  return [...seen.values()];
}

// ── Main: streamAgentResponse ───────────────────────────────────────

export async function streamAgentResponse(opts: StreamChatOptions): Promise<ReadableStream> {
  const {
    question,
    messages,
    conversationId,
    userId,
    language,
    catalogType,
    yearFrom,
    yearTo,
    author,
    isIncognito = false,
    isFirstMessage = false,
  } = opts;

  const startTime = Date.now();
  const sessionMemory = isIncognito ? null : getSessionMemory();

  // ── Build messages for the model ───────────────────────────────────
  const modelMessages: ModelMessage[] = [];

  // Add conversation history
  for (const msg of messages) {
    if (msg.role === "user") {
      modelMessages.push({ role: "user", content: msg.content });
    } else if (msg.role === "assistant") {
      modelMessages.push({ role: "assistant", content: msg.content });
    }
  }

  // Append filter hints to the current user message
  let userText = question;
  const filterParts: string[] = [];
  if (language && !language.startsWith("en")) {
    filterParts.push(`[respond in language: ${language}]`);
  }
  if (catalogType) filterParts.push(`[filter catalog_type: ${catalogType}]`);
  if (yearFrom) filterParts.push(`[filter year_from: ${yearFrom}]`);
  if (yearTo) filterParts.push(`[filter year_to: ${yearTo}]`);
  if (author) filterParts.push(`[filter author: ${author}]`);
  if (filterParts.length > 0) {
    userText = `${userText}\n\n${filterParts.join(" ")}`;
  }

  // Replace the last user message with the enriched version
  if (modelMessages.length > 0 && modelMessages[modelMessages.length - 1].role === "user") {
    modelMessages[modelMessages.length - 1] = { role: "user", content: userText };
  } else {
    modelMessages.push({ role: "user", content: userText });
  }

  // ── Create the stream ──────────────────────────────────────────────
  const result = streamText({
    model: getModel(),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools: researchTools,
    stopWhen: stepCountIs(10),
    onStepFinish: async ({ toolResults }) => {
      // This callback fires after each tool execution step
      // We don't use it for SSE events since we process the stream directly
    },
  });

  // ── Transform the AI SDK stream into our SSE format ────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // ── Emit agent_start ───────────────────────────────────────────
      controller.enqueue(
        encoder.encode(
          formatSSE({
            type: "agent_start",
            message: "Starting research agent…",
            question,
            timestamp: startTime,
          }),
        ),
      );

      let finalAnswer = "";
      let allToolResults: ToolResultLike[] = [];
      let searchQuery: string | null = null;
      let emittedAnswerStart = false;
      let stepCounter = 0;
      let sources: CitedPaper[] = [];

      try {
        // ── Process the stream ────────────────────────────────────────
        // The AI SDK streamText result has:
        //  - textStream: yields text deltas
        //  - toolCallStreaming: yields tool call chunks
        //  - toolResults: (only available after full consumption in non-stream mode)
        //  - steps: (only available after full consumption)
        //
        // We use the merge-promise pattern to consume the full result
        // and build the SSE events.

        for await (const part of result.fullStream) {
          switch (part.type) {
            // ── Tool call start ────────────────────────────────────
            case "tool-call": {
              stepCounter++;
              const stepId = `step_${stepCounter}`;
              const toolName = part.toolName;
              const toolCallId = part.toolCallId;

              // Status hint based on tool
              if (toolName === "create_plan") {
                controller.enqueue(
                  encoder.encode(
                    formatSSE({
                      type: "status",
                      step: "planning",
                      message: "Planning research steps…",
                    }),
                  ),
                );
              } else if (toolName === "search_papers") {
                controller.enqueue(
                  encoder.encode(
                    formatSSE({
                      type: "status",
                      step: "searching",
                      message: "Searching the academic catalog…",
                    }),
                  ),
                );
              } else if (toolName === "get_paper_details") {
                controller.enqueue(
                  encoder.encode(
                    formatSSE({
                      type: "status",
                      step: "reading",
                      message: "Reading paper details…",
                    }),
                  ),
                );
              }

              controller.enqueue(
                encoder.encode(
                  formatSSE({
                    type: "tool_call_start",
                    source: "main",
                    tool: toolName,
                    tool_call_id: toolCallId,
                    step_id: stepId,
                    is_subagent: false,
                  }),
                ),
              );

              controller.enqueue(
                encoder.encode(
                  formatSSE({
                    type: "step_start",
                    step_id: stepId,
                    title: {
                      create_plan: "Planning",
                      search_papers: "Searching Papers",
                      get_paper_details: "Reading Paper Details",
                    }[toolName] || toolName,
                    description: "",
                  }),
                ),
              );

              // Stream the tool call arguments
              const argsStr = JSON.stringify(part.input);
              controller.enqueue(
                encoder.encode(
                  formatSSE({
                    type: "tool_call_args",
                    source: "main",
                    tool_call_id: toolCallId,
                    tool: toolName,
                    args_chunk: argsStr,
                  }),
                ),
              );

              break;
            }

            // ── Tool result ─────────────────────────────────────────
            case "tool-result": {
              allToolResults.push(part as ToolResultLike);

              const toolName = part.toolName;
              const toolCallId = part.toolCallId;
              const parsed = safeJsonParse(part.output);

              stepCounter++;
              const stepId = `step_${stepCounter}`;

              if (toolName === "create_plan") {
                const steps: string[] = Array.isArray(parsed?.steps)
                  ? parsed.steps.map(String)
                  : [];
                if (steps.length > 0) {
                  controller.enqueue(
                    encoder.encode(formatSSE({ type: "plan", steps })),
                  );
                }
                controller.enqueue(
                  encoder.encode(
                    formatSSE({
                      type: "tool_call_done",
                      source: "main",
                      tool_call_id: toolCallId,
                      tool: toolName,
                      success: true,
                      summary: `Created ${steps.length} steps`,
                    }),
                  ),
                );
                controller.enqueue(
                  encoder.encode(
                    formatSSE({ type: "step_done", step_id: stepId }),
                  ),
                );
              } else if (toolName === "search_papers") {
                const papersList: Array<Record<string, unknown>> =
                  Array.isArray(parsed?.papers) ? parsed.papers : [];
                const resultStatus = String(parsed?.status ?? "unknown");

                // Extract query from tool input
                controller.enqueue(
                  encoder.encode(
                    formatSSE({
                      type: "search_result",
                      source: "main",
                      tool_call_id: toolCallId,
                      query: String((part.input as Record<string, unknown>)?.query ?? ""),
                      status: resultStatus,
                      paper_count: papersList.length,
                      papers: papersList.map((p, i) => ({
                        number: Number(p.paper_number) || i + 1,
                        title: String(p.title ?? ""),
                        authors: Array.isArray(p.authors) ? p.authors : [],
                        year: Number(p.year) || 0,
                        relevance: Number(p.relevance_score) || 0,
                      })),
                    }),
                  ),
                );

                const inputQuery = (part.input as Record<string, unknown>)?.query;
                if (inputQuery && !searchQuery) {
                  searchQuery = String(inputQuery);
                }

                controller.enqueue(
                  encoder.encode(
                    formatSSE({
                      type: "tool_call_done",
                      source: "main",
                      tool_call_id: toolCallId,
                      tool: toolName,
                      success: resultStatus === "success",
                      summary:
                        resultStatus === "success"
                          ? `Found ${papersList.length} papers`
                          : String(parsed?.message ?? "No results"),
                    }),
                  ),
                );
                controller.enqueue(
                  encoder.encode(
                    formatSSE({ type: "step_done", step_id: stepId }),
                  ),
                );
              } else if (toolName === "get_paper_details") {
                const count = Number(parsed?.count) || 0;
                controller.enqueue(
                  encoder.encode(
                    formatSSE({
                      type: "tool_call_done",
                      source: "main",
                      tool_call_id: toolCallId,
                      tool: toolName,
                      success: true,
                      summary: `Retrieved details for ${count} paper(s)`,
                    }),
                  ),
                );
                controller.enqueue(
                  encoder.encode(
                    formatSSE({ type: "step_done", step_id: stepId }),
                  ),
                );
              } else {
                controller.enqueue(
                  encoder.encode(
                    formatSSE({
                      type: "tool_call_done",
                      source: "main",
                      tool_call_id: toolCallId,
                      tool: toolName,
                      success: true,
                      summary: truncate(String(part.output)),
                    }),
                  ),
                );
                controller.enqueue(
                  encoder.encode(
                    formatSSE({ type: "step_done", step_id: stepId }),
                  ),
                );
              }

              break;
            }

            // ── Text delta (final answer) ───────────────────────────
            case "text-delta": {
              if (!emittedAnswerStart) {
                emittedAnswerStart = true;
                controller.enqueue(
                  encoder.encode(
                    formatSSE({
                      type: "status",
                      step: "synthesizing",
                      message: "Writing answer…",
                    }),
                  ),
                );
                controller.enqueue(
                  encoder.encode(formatSSE({ type: "answer_start" })),
                );
              }
              finalAnswer += part.text;
              controller.enqueue(
                encoder.encode(
                  formatSSE({
                    type: "answer_token",
                    content: part.text,
                    source: "main",
                  }),
                ),
              );
              break;
            }

            // ── Step finish ─────────────────────────────────────────
            case "finish-step": {
              // Tool results are collected individually via "tool-result" events
              break;
            }

            // ── Finish ──────────────────────────────────────────────
            case "finish": {
              // This fires when the stream is complete
              break;
            }

            default:
              // Ignore other part types (error, etc.)
              break;
          }
        }

        // ── Post-stream processing ────────────────────────────────────

        // Extract sources from tool results
        sources = extractSources(allToolResults);

        // Citation audit
        if (sources.length > 0) {
          const audit = auditCitations(finalAnswer, sources);
          controller.enqueue(
            encoder.encode(
              formatSSE({
                type: "citation_audit",
                is_clean: audit.isClean,
                hallucinated_citation_numbers: audit.hallucinatedCitationNumbers,
              }),
            ),
          );
        }

        const durationMs = Date.now() - startTime;

        // Done event
        controller.enqueue(
          encoder.encode(
            formatSSE({
              type: "done",
              content: finalAnswer,
              sources,
              duration_ms: durationMs,
              tool_calls_count: stepCounter,
            }),
          ),
        );

        // ── Persist to DB ────────────────────────────────────────────
        if (sessionMemory && conversationId && !isIncognito) {
          try {
            await sessionMemory.addMessage(
              conversationId,
              {
                role: "assistant",
                question,
                answer: finalAnswer,
                sources: sources.length > 0 ? sources : undefined,
                searchQuery: searchQuery || undefined,
              },
              { userId },
            );
          } catch (error) {
            console.warn("[AGENT] Failed to persist message:", error);
          }
        }

        // ── Title generation (first message only, non-incognito) ─────
        if (
          isIncognito === false &&
          isFirstMessage &&
          conversationId &&
          userId
        ) {
          try {
            const title = await generateTitle(question, finalAnswer);
            controller.enqueue(
              encoder.encode(
                formatSSE({ type: "title", content: title }),
              ),
            );

            // Update conversation title in DB
            if (sessionMemory) {
              try {
                const { db } = await import("@/db");
                const { conversations: convTable } = await import("@/db/schema/conversations");
                const { eq } = await import("drizzle-orm");
                await db
                  .update(convTable)
                  .set({ title, updatedAt: new Date() })
                  .where(eq(convTable.id, conversationId));
              } catch (error) {
                console.warn("[AGENT] Failed to update conversation title:", error);
              }
            }
          } catch (error) {
            console.warn("[AGENT] Title generation failed:", error);
          }
        }

        // ── Finish signal ────────────────────────────────────────────
        controller.enqueue(encoder.encode(formatFinish()));
      } catch (error) {
        console.error("[AGENT] Stream error:", error);
        controller.enqueue(
          encoder.encode(
            formatSSE({
              type: "error",
              content: error instanceof Error ? error.message : String(error),
            }),
          ),
        );
        controller.enqueue(encoder.encode(formatFinish()));
      } finally {
        controller.close();
      }
    },
  });

  return stream;
}

// ── Title generation ─────────────────────────────────────────────────

async function generateTitle(question: string, answer: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: getModel(),
      prompt: [
        "Generate a short title (max 50 characters) for this conversation.",
        "",
        `Question: ${question}`,
        `Answer summary: ${answer.slice(0, 200)}`,
        "",
        "Return ONLY the title, nothing else.",
      ].join("\n"),
      maxOutputTokens: 100,
      temperature: 0.3,
    });

    const title = text.trim().replace(/^["']|["']$/g, "");
    return title.length > 50 ? `${title.slice(0, 47)}…` : title;
  } catch (error) {
    console.warn("[AGENT] generateTitle failed:", error);
    const q = question.trim();
    return q.length > 50 ? `${q.slice(0, 47)}…` : q;
  }
}
