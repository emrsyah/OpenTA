"use client";

import type { ChatStatus } from "ai";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatFilters } from "@/components/chat/chat-filter-types";

export type MessageRole = "user" | "assistant";

export interface TextPart {
  type: "text";
  text: string;
}

export interface Source {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  citation_number: number;
}

export interface CitationAuditResult {
  isClean: boolean;
  hallucinatedNumbers: number[];
}

export interface ReformulatedQuery {
  original: string;
  query: string;
  paperCount: number;
}

export type RefinementState =
  | "idle"
  | "starting"
  | "searching"
  | "streaming"
  | "done";

// ── Rich Activity Feed Types (Manus-like) ─────────────────────────────────

/** A single paper preview in search results */
export interface SearchResultPaper {
  number: number;
  title: string;
  authors: string[];
  year: number;
  relevance: number;
}

/** Represents a single tool call with full lifecycle tracking */
export interface ToolCallEntry {
  id: string;
  tool: string;
  source: string; // "main" or subagent_id
  stepId?: string;
  isSubagent: boolean;
  status: "calling" | "streaming_args" | "executing" | "done" | "error";
  argsRaw: string; // accumulated raw JSON args string
  argsParsed: Record<string, unknown> | null; // parsed args (when valid JSON)
  result?: {
    success: boolean;
    summary: string;
  };
  // Search-specific enrichments
  searchQuery?: string;
  searchPaperCount?: number;
  searchPapers?: SearchResultPaper[];
  startedAt: number;
  finishedAt?: number;
}

/** Represents a subagent lifecycle */
export interface SubagentEntry {
  id: string;
  type: string;
  description: string;
  status: "spawning" | "running" | "complete" | "error";
  stepId?: string;
  args?: Record<string, unknown>;
  toolCalls: { tool: string; toolCallId: string }[];
  events: ActivityEvent[]; // nested events from inside the subagent
  streamText: string;
  resultPreview?: string;
}

/** A single entry in the activity feed timeline */
export interface ActivityEvent {
  id: string;
  timestamp: number;
  type:
    | "agent_start"
    | "status"
    | "plan"
    | "step_start"
    | "step_done"
    | "tool_call_start"
    | "tool_call_args"
    | "tool_call_done"
    | "search_result"
    | "subagent_spawn"
    | "subagent_event"
    | "subagent_done"
    | "answer_start"
    | "error";
  source: string;
  data: Record<string, unknown>;
}

// ── Legacy PlanStep (kept for backward compat) ────────────────────────────

export interface PlanStep {
  id: number | string;
  title: string;
  description: string;
  needs_search: boolean;
  status: "pending" | "active" | "done";
  thinking: string;
  searchQuery?: string;
  paperCount?: number;
  reformulatedQuery?: ReformulatedQuery;
}

// ── Chat Message ──────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  parts: TextPart[];
  sources?: Source[];
  classifyStatus?: string;
  planSteps?: PlanStep[];
  answerStarted?: boolean;
  isThinking?: boolean;
  thinkingContent?: string;
  acknowledgment?: string;
  citationAudit?: CitationAuditResult;
  refinementState?: RefinementState;

  // ── Rich Activity Feed (Manus-like) ──
  activityFeed: ActivityEvent[];
  toolCalls: Record<string, ToolCallEntry>;
  subagents: Record<string, SubagentEntry>;
  planStepsList: string[]; // flat list of plan step titles from write_todos
  agentStarted: boolean;
  durationMs?: number;
}

interface SendMessageOptions {
  body?: Record<string, unknown>;
}

interface DbMessage {
  question: string;
  answer: string;
  sources: Source[] | null;
  searchQuery: string | null;
}

interface UseStreamingChatOptions {
  conversationId?: string;
  api?: string;
  filters?: ChatFilters;
  onConversationCreated?: (conversationId: string) => void;
  onTitleGenerated?: (conversationId: string, title: string) => void;
}

/**
 * Convert DB message to ChatMessage format
 */
function dbMessageToChatMessage(
  question: string,
  answer: string,
  sources?: Source[] | null,
  searchQuery?: string | null,
): [ChatMessage, ChatMessage] {
  const userMessage: ChatMessage = {
    id: nanoid(),
    role: "user",
    content: question,
    parts: [{ type: "text", text: question }],
    activityFeed: [],
    toolCalls: {},
    subagents: {},
    planStepsList: [],
    agentStarted: false,
  };

  const assistantMessage: ChatMessage = {
    id: nanoid(),
    role: "assistant",
    content: answer,
    parts: [{ type: "text", text: answer }],
    sources: sources || undefined,
    activityFeed: [],
    toolCalls: {},
    subagents: {},
    planStepsList: [],
    agentStarted: false,
  };

  return [userMessage, assistantMessage];
}

/**
 * Load conversation history from database
 */
async function loadConversationHistory(
  conversationId: string,
): Promise<ChatMessage[]> {
  try {
    const response = await fetch(
      `/api/conversations/${conversationId}/messages`,
    );

    // 404 is normal for new conversations - return empty array
    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      console.error("Failed to load conversation history");
      return [];
    }

    const data = await response.json();
    const dbMessages: DbMessage[] = data.messages || [];

    // Convert DB messages to ChatMessage format
    const chatMessages: ChatMessage[] = [];
    for (const dbMsg of dbMessages) {
      const [userMsg, assistantMsg] = dbMessageToChatMessage(
        dbMsg.question,
        dbMsg.answer,
        dbMsg.sources,
        dbMsg.searchQuery,
      );
      chatMessages.push(userMsg, assistantMsg);
    }

    return chatMessages;
  } catch (error) {
    console.error("Error loading conversation history:", error);
    return [];
  }
}

/** Helper: create a new activity event */
function makeEvent(
  type: ActivityEvent["type"],
  source: string,
  data: Record<string, unknown>,
): ActivityEvent {
  return {
    id: nanoid(8),
    timestamp: Date.now(),
    type,
    source,
    data,
  };
}

/** Safely parse JSON, return null on failure */
function safeParse(s: string): Record<string, unknown> | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export function useStreamingChat(options?: UseStreamingChatOptions) {
  const {
    conversationId,
    api = "/api/chat",
    filters,
    onConversationCreated,
    onTitleGenerated,
  } = options || {};
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [error, setError] = useState<Error | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const conversationCreatedRef = useRef(false);

  // Load conversation history when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const history = await loadConversationHistory(conversationId);
        // Only set messages if none have been added yet (avoid wiping in-flight messages)
        setMessages((prev) => (prev.length === 0 ? history : prev));
      } catch (error) {
        console.error("Failed to load conversation history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [conversationId]);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus("ready");
  }, []);

  const sendMessage = useCallback(
    async (text: string, options?: SendMessageOptions) => {
      if (!text.trim()) return;

      const userMessage: ChatMessage = {
        id: nanoid(),
        role: "user",
        content: text,
        parts: [{ type: "text", text }],
        activityFeed: [],
        toolCalls: {},
        subagents: {},
        planStepsList: [],
        agentStarted: false,
      };

      const assistantId = nanoid();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        parts: [{ type: "text", text: "" }],
        isThinking: true,
        activityFeed: [],
        toolCalls: {},
        subagents: {},
        planStepsList: [],
        agentStarted: false,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setStatus("streaming");
      setError(null);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              parts: m.parts,
            })),
            ...options?.body,
          }),
        });

        if (!response.ok)
          throw new Error(`Request failed with status ${response.status}`);
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let lineBuffer = "";

        const updateAssistant = (
          updater: (msg: ChatMessage) => ChatMessage,
        ) => {
          setMessages((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((m) => m.id === assistantId);
            if (idx !== -1) updated[idx] = updater(updated[idx]);
            return updated;
          });
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          lineBuffer += decoder.decode(value, { stream: true });
          const lines = lineBuffer.split("\n");
          lineBuffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
              const event = JSON.parse(trimmed);

              switch (event.type) {
                // ── Agent lifecycle ──────────────────────────────────
                case "agent_start":
                  updateAssistant((msg) => ({
                    ...msg,
                    isThinking: true,
                    agentStarted: true,
                    activityFeed: [
                      ...msg.activityFeed,
                      makeEvent("agent_start", "main", {
                        message: event.message,
                      }),
                    ],
                  }));
                  break;

                case "status":
                  updateAssistant((msg) => ({
                    ...msg,
                    classifyStatus: event.step,
                    activityFeed: [
                      ...msg.activityFeed,
                      makeEvent("status", "main", {
                        step: event.step,
                        message: event.message,
                      }),
                    ],
                  }));
                  break;

                // ── Plan (write_todos result) ───────────────────────
                case "plan":
                  updateAssistant((msg) => {
                    const steps = Array.isArray(event.steps)
                      ? event.steps
                      : [];
                    return {
                      ...msg,
                      isThinking: false,
                      planStepsList: steps.map((s: unknown) =>
                        typeof s === "string" ? s : String(s),
                      ),
                      // Legacy planSteps for backward compat
                      planSteps: steps.map(
                        (rawStep: unknown, index: number) => {
                          const title =
                            typeof rawStep === "string"
                              ? rawStep
                              : `Step ${index + 1}`;
                          return {
                            id: `plan_${index + 1}`,
                            title,
                            description: title,
                            needs_search: true,
                            status: "pending" as const,
                            thinking: "",
                          };
                        },
                      ),
                      activityFeed: [
                        ...msg.activityFeed,
                        makeEvent("plan", "main", { steps }),
                      ],
                    };
                  });
                  break;

                // ── Step lifecycle ───────────────────────────────────
                case "step_start":
                  updateAssistant((msg) => ({
                    ...msg,
                    activityFeed: [
                      ...msg.activityFeed,
                      makeEvent("step_start", event.source || "main", {
                        step_id: event.step_id,
                        title: event.title,
                        description: event.description,
                      }),
                    ],
                  }));
                  break;

                case "step_done":
                  updateAssistant((msg) => ({
                    ...msg,
                    activityFeed: [
                      ...msg.activityFeed,
                      makeEvent("step_done", event.source || "main", {
                        step_id: event.step_id,
                      }),
                    ],
                  }));
                  break;

                // ── Tool call lifecycle (Manus-like) ────────────────
                case "tool_call_start":
                  updateAssistant((msg) => {
                    const entry: ToolCallEntry = {
                      id: event.tool_call_id,
                      tool: event.tool,
                      source: event.source || "main",
                      stepId: event.step_id,
                      isSubagent: Boolean(event.is_subagent),
                      status: "calling",
                      argsRaw: "",
                      argsParsed: null,
                      startedAt: Date.now(),
                    };
                    return {
                      ...msg,
                      isThinking: false,
                      toolCalls: {
                        ...msg.toolCalls,
                        [entry.id]: entry,
                      },
                      activityFeed: [
                        ...msg.activityFeed,
                        makeEvent(
                          "tool_call_start",
                          event.source || "main",
                          {
                            tool: event.tool,
                            tool_call_id: event.tool_call_id,
                            step_id: event.step_id,
                            is_subagent: event.is_subagent,
                          },
                        ),
                      ],
                    };
                  });
                  break;

                case "tool_call_args":
                  updateAssistant((msg) => {
                    const callId = event.tool_call_id as string;
                    const existing = msg.toolCalls[callId];
                    if (!existing) return msg;

                    const newRaw =
                      existing.argsRaw + (event.args_chunk || "");
                    const parsed = safeParse(newRaw);

                    return {
                      ...msg,
                      toolCalls: {
                        ...msg.toolCalls,
                        [callId]: {
                          ...existing,
                          status: "streaming_args",
                          argsRaw: newRaw,
                          argsParsed: parsed,
                        },
                      },
                      // Don't add to activityFeed for every chunk (too noisy)
                    };
                  });
                  break;

                case "tool_call_done":
                  updateAssistant((msg) => {
                    const callId = event.tool_call_id as string;
                    const existing = msg.toolCalls[callId];
                    if (!existing) return msg;

                    return {
                      ...msg,
                      toolCalls: {
                        ...msg.toolCalls,
                        [callId]: {
                          ...existing,
                          status: "done",
                          result: {
                            success: Boolean(event.success),
                            summary: String(event.summary || ""),
                          },
                          finishedAt: Date.now(),
                        },
                      },
                      activityFeed: [
                        ...msg.activityFeed,
                        makeEvent(
                          "tool_call_done",
                          event.source || "main",
                          {
                            tool: event.tool,
                            tool_call_id: callId,
                            success: event.success,
                            summary: event.summary,
                          },
                        ),
                      ],
                    };
                  });
                  break;

                // ── Search results (rich detail) ────────────────────
                case "search_result":
                  updateAssistant((msg) => {
                    const callId = event.tool_call_id as string;
                    const existing = msg.toolCalls[callId];

                    const papers = (
                      event.papers as SearchResultPaper[] | undefined
                    )?.map((p) => ({
                      number: p.number,
                      title: p.title,
                      authors: p.authors || [],
                      year: p.year,
                      relevance: p.relevance || 0,
                    }));

                    const updatedToolCalls = existing
                      ? {
                          ...msg.toolCalls,
                          [callId]: {
                            ...existing,
                            searchQuery: String(event.query || ""),
                            searchPaperCount: Number(event.paper_count || 0),
                            searchPapers: papers,
                          },
                        }
                      : msg.toolCalls;

                    return {
                      ...msg,
                      toolCalls: updatedToolCalls,
                      activityFeed: [
                        ...msg.activityFeed,
                        makeEvent(
                          "search_result",
                          event.source || "main",
                          {
                            tool_call_id: callId,
                            query: event.query,
                            status: event.status,
                            paper_count: event.paper_count,
                            papers: papers,
                          },
                        ),
                      ],
                    };
                  });
                  break;

                // ── Step action (legacy compat + activity feed) ─────
                case "step_action":
                  updateAssistant((msg) => ({
                    ...msg,
                    activityFeed: [
                      ...msg.activityFeed,
                      makeEvent("step_start", event.source || "main", {
                        step_id: event.step_id,
                        action: event.action,
                        query: event.query,
                        args: event.args,
                      }),
                    ],
                  }));
                  break;

                case "step_action_result":
                  // Legacy — handled by search_result now
                  break;

                case "step_thinking":
                  // Legacy — no longer emitted by DeepAgents backend
                  break;

                // ── Subagent lifecycle (Manus-like) ─────────────────
                case "subagent_spawn":
                  updateAssistant((msg) => {
                    const entry: SubagentEntry = {
                      id: event.subagent_id,
                      type: event.subagent_type || "unknown",
                      description: event.description || "",
                      status: "spawning",
                      stepId: event.step_id,
                      args: event.args,
                      toolCalls: [],
                      events: [],
                      streamText: "",
                    };
                    return {
                      ...msg,
                      subagents: {
                        ...msg.subagents,
                        [entry.id]: entry,
                      },
                      activityFeed: [
                        ...msg.activityFeed,
                        makeEvent(
                          "subagent_spawn",
                          "main",
                          {
                            subagent_id: event.subagent_id,
                            subagent_type: event.subagent_type,
                            description: event.description,
                            step_id: event.step_id,
                          },
                        ),
                      ],
                    };
                  });
                  break;

                case "subagent_event":
                  updateAssistant((msg) => {
                    const subId = event.subagent_id as string;
                    const sub = msg.subagents[subId];
                    if (!sub) return msg;

                    const newEvent = makeEvent(
                      "subagent_event",
                      subId,
                      {
                        event_type: event.event,
                        tool: event.tool,
                        tool_call_id: event.tool_call_id,
                      },
                    );

                    const updatedSub = {
                      ...sub,
                      status: "running" as const,
                      events: [...sub.events, newEvent],
                      toolCalls:
                        event.event === "tool_call"
                          ? [
                              ...sub.toolCalls,
                              {
                                tool: event.tool,
                                toolCallId: event.tool_call_id,
                              },
                            ]
                          : sub.toolCalls,
                    };

                    return {
                      ...msg,
                      subagents: {
                        ...msg.subagents,
                        [subId]: updatedSub,
                      },
                      activityFeed: [
                        ...msg.activityFeed,
                        newEvent,
                      ],
                    };
                  });
                  break;

                case "subagent_done":
                  updateAssistant((msg) => {
                    const subId = event.subagent_id as string;
                    const sub = msg.subagents[subId];
                    if (!sub) return msg;

                    return {
                      ...msg,
                      subagents: {
                        ...msg.subagents,
                        [subId]: {
                          ...sub,
                          status: "complete" as const,
                          resultPreview: event.result_preview,
                        },
                      },
                      activityFeed: [
                        ...msg.activityFeed,
                        makeEvent("subagent_done", "main", {
                          subagent_id: subId,
                          subagent_type: event.subagent_type,
                          result_preview: event.result_preview,
                        }),
                      ],
                    };
                  });
                  break;

                case "subagent_token":
                  updateAssistant((msg) => {
                    const subId = String(event.subagent_id || "");
                    if (!subId) return msg;

                    const sub = msg.subagents[subId];
                    if (sub) {
                      return {
                        ...msg,
                        subagents: {
                          ...msg.subagents,
                          [subId]: {
                            ...sub,
                            status: "running" as const,
                            streamText:
                              sub.streamText + (event.content || ""),
                          },
                        },
                      };
                    }

                    // Auto-create subagent entry if we see tokens before spawn
                    return {
                      ...msg,
                      subagents: {
                        ...msg.subagents,
                        [subId]: {
                          id: subId,
                          type: "paper-researcher",
                          description: "Subagent stream",
                          status: "running" as const,
                          toolCalls: [],
                          events: [],
                          streamText: event.content || "",
                        },
                      },
                    };
                  });
                  break;

                // ── Answer streaming ────────────────────────────────
                case "answer_start":
                  updateAssistant((msg) => ({
                    ...msg,
                    answerStarted: true,
                    isThinking: false,
                    activityFeed: [
                      ...msg.activityFeed,
                      makeEvent("answer_start", "main", {}),
                    ],
                  }));
                  break;

                case "answer_token":
                  updateAssistant((msg) => {
                    const newText = msg.content + event.content;
                    return {
                      ...msg,
                      content: newText,
                      parts: [{ type: "text", text: newText }],
                    };
                  });
                  break;

                // ── Legacy events (backward compat with DSPy backend) ──
                case "simple_thinking":
                  updateAssistant((msg) => ({
                    ...msg,
                    isThinking: true,
                  }));
                  break;

                case "acknowledgment":
                  updateAssistant((msg) => ({
                    ...msg,
                    isThinking: false,
                    acknowledgment: event.content,
                  }));
                  break;

                case "thinking_start":
                  updateAssistant((msg) => ({ ...msg, isThinking: true }));
                  break;

                case "thinking_token":
                  updateAssistant((msg) => ({
                    ...msg,
                    thinkingContent:
                      (msg.thinkingContent ?? "") + event.content,
                  }));
                  break;

                case "thinking_end":
                  updateAssistant((msg) => ({
                    ...msg,
                    isThinking: false,
                    answerStarted: true,
                  }));
                  break;

                case "text":
                  updateAssistant((msg) => {
                    const newText = msg.content + event.content;
                    return {
                      ...msg,
                      content: newText,
                      parts: [{ type: "text", text: newText }],
                    };
                  });
                  break;

                // ── Legacy tool_call event ──
                case "tool_call":
                  // Handled by tool_call_start now; ignore legacy
                  break;

                case "sources":
                  updateAssistant((msg) => ({ ...msg, sources: event.data }));
                  break;

                case "done":
                  updateAssistant((msg) => ({
                    ...msg,
                    sources: event.sources || msg.sources,
                    durationMs: event.duration_ms,
                  }));
                  break;

                case "title":
                  if (conversationId && onTitleGenerated) {
                    onTitleGenerated(conversationId, event.content);
                  }
                  break;

                case "finish":
                  updateAssistant((msg) => ({
                    ...msg,
                    // Mark all legacy plan steps as done
                    planSteps: (msg.planSteps ?? []).map((s) => ({
                      ...s,
                      status: "done" as const,
                    })),
                  }));
                  // Notify sidebar to refresh
                  if (
                    conversationId &&
                    onConversationCreated &&
                    !conversationCreatedRef.current
                  ) {
                    conversationCreatedRef.current = true;
                    onConversationCreated(conversationId);
                  }
                  break;

                case "citation_audit":
                  updateAssistant((msg) => ({
                    ...msg,
                    citationAudit: {
                      isClean: event.is_clean,
                      hallucinatedNumbers:
                        event.hallucinated_citation_numbers,
                    },
                  }));
                  break;

                // ── Refinement events ───────────────────────────────
                case "refinement_start":
                  updateAssistant((msg) => ({
                    ...msg,
                    refinementState: "starting",
                  }));
                  break;

                case "refinement_search":
                  updateAssistant((msg) => ({
                    ...msg,
                    refinementState: "searching",
                  }));
                  break;

                case "refinement_token":
                  updateAssistant((msg) => {
                    const newText = msg.content + event.content;
                    return {
                      ...msg,
                      content: newText,
                      parts: [{ type: "text", text: newText }],
                      refinementState: "streaming",
                    };
                  });
                  break;

                case "refinement_done":
                  updateAssistant((msg) => ({
                    ...msg,
                    content: event.content,
                    parts: [{ type: "text", text: event.content }],
                    sources: event.sources || msg.sources,
                    refinementState: "done",
                  }));
                  break;

                case "error":
                  console.error("Stream error:", event.content);
                  updateAssistant((msg) => ({
                    ...msg,
                    activityFeed: [
                      ...msg.activityFeed,
                      makeEvent("error", "main", {
                        content: event.content,
                      }),
                    ],
                  }));
                  break;
              }
            } catch {
              // Not valid JSON, skip
            }
          }
        }

        setStatus("ready");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setStatus("error");
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      }
    },
    [api, messages],
  );

  return { messages, status, error, sendMessage, stop, isLoadingHistory };
}
