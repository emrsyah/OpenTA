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

export type RefinementState = 'idle' | 'starting' | 'searching' | 'streaming' | 'done';

export interface PlanStep {
  id: number;
  title: string;
  description: string;
  needs_search: boolean;
  status: "pending" | "active" | "done";
  thinking: string;
  searchQuery?: string;
  paperCount?: number;
  reformulatedQuery?: ReformulatedQuery;
}

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
  thinkingContent?: string;   // accumulated CoT reasoning trace
  acknowledgment?: string;
  citationAudit?: CitationAuditResult;
  refinementState?: RefinementState;
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
  };

  const assistantMessage: ChatMessage = {
    id: nanoid(),
    role: "assistant",
    content: answer,
    parts: [{ type: "text", text: answer }],
    sources: sources || undefined,
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
      };

      const assistantId = nanoid();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        parts: [{ type: "text", text: "" }],
        isThinking: true,
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

        const updateStep = (
          step_id: number,
          updater: (s: PlanStep) => PlanStep,
        ) => {
          updateAssistant((msg) => ({
            ...msg,
            planSteps: (msg.planSteps ?? []).map((s) =>
              s.id === step_id ? updater(s) : s,
            ),
          }));
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
                case "simple_thinking":
                  updateAssistant((msg) => ({
                    ...msg,
                    isThinking: true,
                  }));
                  break;

                case "status":
                  updateAssistant((msg) => ({
                    ...msg,
                    classifyStatus: event.step,
                    // Keep thinking true until acknowledgment or plan arrives
                    // This prevents the empty gap during acknowledgment generation
                  }));
                  break;

                case "acknowledgment":
                  updateAssistant((msg) => ({
                    ...msg,
                    isThinking: false, // Stop thinking when acknowledgment arrives
                    acknowledgment: event.content,
                  }));
                  break;

                case "plan":
                  updateAssistant((msg) => ({
                    ...msg,
                    isThinking: false, // Stop thinking when plan starts
                    planSteps: (
                      event.steps as Array<{
                        id: number;
                        title: string;
                        description: string;
                        needs_search: boolean;
                      }>
                    ).map((s) => ({
                      id: s.id,
                      title: s.title,
                      description: s.description,
                      needs_search: s.needs_search,
                      status: "pending" as const,
                      thinking: "",
                    })),
                  }));
                  break;

                case "step_start":
                  updateStep(event.step_id, (s) => ({
                    ...s,
                    status: "active",
                  }));
                  break;

                case "step_action":
                  if (event.action === "search" && event.query) {
                    updateStep(event.step_id, (s) => ({
                      ...s,
                      searchQuery: event.query,
                    }));
                  } else if (event.action === "reformulated_query") {
                    updateStep(event.step_id, (s) => ({
                      ...s,
                      reformulatedQuery: {
                        original: event.original_query,
                        query: event.query,
                        paperCount: event.paper_count,
                      },
                    }));
                  }
                  break;

                case "step_action_result":
                  if (event.action === "search") {
                    updateStep(event.step_id, (s) => ({
                      ...s,
                      paperCount: event.paper_count,
                    }));
                  }
                  break;

                case "step_thinking":
                  updateStep(event.step_id, (s) => ({
                    ...s,
                    thinking: s.thinking + event.content,
                  }));
                  break;

                case "step_done":
                  updateStep(event.step_id, (s) => ({ ...s, status: "done" }));
                  break;

                case "answer_start":
                  updateAssistant((msg) => ({
                    ...msg,
                    answerStarted: true,
                    isThinking: false, // Ensure thinking stops when answer starts
                  }));
                  break;

                case "thinking_start":
                  // CoT is about to generate a reasoning trace before the answer.
                  // Keep the message in thinking state — reasoning_tokens will follow.
                  updateAssistant((msg) => ({ ...msg, isThinking: true }));
                  break;

                case "thinking_token":
                  // Accumulate CoT reasoning tokens (shown in a collapsible block)
                  updateAssistant((msg) => ({
                    ...msg,
                    thinkingContent: (msg.thinkingContent ?? "") + event.content,
                  }));
                  break;

                case "thinking_end":
                  // Reasoning trace is done — answer tokens or done event follows.
                  // Mark answerStarted so the answer area renders now, not just on first token.
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

                case "sources":
                  updateAssistant((msg) => ({ ...msg, sources: event.data }));
                  break;

                case "done":
                  // Signals answer + sources are complete; sidebar refresh happens on finish
                  break;

                case "title":
                  if (conversationId && onTitleGenerated) {
                    onTitleGenerated(conversationId, event.content);
                  }
                  break;

                case "finish":
                  updateAssistant((msg) => ({
                    ...msg,
                    planSteps: (msg.planSteps ?? []).map((s) => ({
                      ...s,
                      status: "done" as const,
                    })),
                  }));
                  // Notify sidebar to refresh after everything is complete
                  if (
                    conversationId &&
                    onConversationCreated &&
                    !conversationCreatedRef.current
                  ) {
                    conversationCreatedRef.current = true;
                    onConversationCreated(conversationId);
                  }
                  break;

                case "refinement_start":
                  updateAssistant((msg) => {
                    const newStep: PlanStep = {
                      id: (msg.planSteps?.length || 0) + 1,
                      title: "Refining answer...",
                      description: event.gap_query || "Enriching response",
                      needs_search: false,
                      status: "active",
                      thinking: "",
                    };
                    return {
                      ...msg,
                      refinementState: "starting",
                      planSteps: [...(msg.planSteps || []), newStep],
                    };
                  });
                  break;

                case "refinement_search":
                  updateAssistant((msg) => {
                    const steps = msg.planSteps || [];
                    const refinementStep = steps[steps.length - 1];
                    if (refinementStep) {
                      return {
                        ...msg,
                        refinementState: "searching",
                        planSteps: [
                          ...steps.slice(0, -1),
                          { ...refinementStep, paperCount: event.paper_count },
                        ],
                      };
                    }
                    return msg;
                  });
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
                    sources: event.sources || msg.sources, // merge sources
                    refinementState: "done",
                    planSteps: (msg.planSteps || []).map((s) => ({
                      ...s,
                      status: "done" as const,
                    })),
                  }));
                  break;

                case "citation_audit":
                  updateAssistant((msg) => ({
                    ...msg,
                    citationAudit: {
                      isClean: event.is_clean,
                      hallucinatedNumbers: event.hallucinated_citation_numbers,
                    },
                  }));
                  break;

                case "error":
                  console.error("Stream error:", event.content);
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
