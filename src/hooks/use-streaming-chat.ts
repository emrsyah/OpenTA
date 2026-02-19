"use client";

import type { ChatStatus } from "ai";
import { useCallback, useRef, useState } from "react";
import { nanoid } from "nanoid";

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

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  parts: TextPart[];
  sources?: Source[];
  rationale?: string;
}

interface SendMessageOptions {
  body?: Record<string, unknown>;
}

export function useStreamingChat(api = "/api/chat") {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let lineBuffer = "";

        const updateAssistant = (updater: (msg: ChatMessage) => ChatMessage) => {
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
                case "text":
                  updateAssistant((msg) => {
                    const newText = msg.content + event.content;
                    return { ...msg, content: newText, parts: [{ type: "text", text: newText }] };
                  });
                  break;

                case "rationale":
                  updateAssistant((msg) => ({
                    ...msg,
                    rationale: (msg.rationale ?? "") + event.content,
                  }));
                  break;

                case "sources":
                  updateAssistant((msg) => ({ ...msg, sources: event.data }));
                  break;

                case "finish":
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

  return { messages, status, error, sendMessage, stop };
}
