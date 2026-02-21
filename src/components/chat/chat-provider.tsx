// ───────────────────────────────────────────────────────────────────────────────
// Chat Provider: Decouples state management from UI
// ───────────────────────────────────────────────────────────────────────────────

"use client";

import { createContext, use, useEffect, useRef, useState } from "react";
import { useConversations } from "@/hooks/use-conversations";
import type { ChatMessage } from "@/hooks/use-streaming-chat";
import { useStreamingChat } from "@/hooks/use-streaming-chat";

// ─── Context Interface ─────────────────────────────────────────────────────────

export interface ChatState {
  conversationId: string;
  model: string;
  webSearchEnabled: boolean;
  messages: ChatMessage[];
  status: "ready" | "streaming" | "error" | "submitted";
  isLoadingHistory: boolean;
}

export interface ChatActions {
  setWebSearchEnabled: (enabled: boolean) => void;
  setModel: (model: string) => void;
  sendMessage: (text: string, files?: any[]) => void;
}

export interface ChatMeta {
  initialSentRef: React.MutableRefObject<boolean>;
}

export interface ChatContextValue {
  state: ChatState;
  actions: ChatActions;
  meta: ChatMeta;
}

const ChatContext = createContext<ChatContextValue | null>(null);

// ─── Provider Component ───────────────────────────────────────────────────────

export interface ChatProviderProps {
  children: React.ReactNode;
  conversationId: string;
  initialWebSearch?: boolean;
  initialQuery?: string;
}

export function ChatProvider({
  children,
  conversationId,
  initialWebSearch = false,
  initialQuery,
}: ChatProviderProps) {
  const { updateConversationTitle, refresh } = useConversations();
  const initialSentRef = useRef(false);

  // State
  const [model, setModel] = useState("gpt-4o");
  const [webSearchEnabled, setWebSearchEnabled] = useState(initialWebSearch);

  // Hook integration
  const { messages, status, sendMessage, isLoadingHistory } = useStreamingChat({
    conversationId,
    onConversationCreated: () => {
      refresh();
    },
    onTitleGenerated: (id, title) => {
      updateConversationTitle(id, title);
    },
  });

  // Actions
  const sendMessageWithFiles = (text: string, files?: any[]) => {
    const messageText = text || (files?.length ? "Sent with attachments" : "");
    if (!messageText) return;

    sendMessage(messageText, {
      body: { conversationId, model, webSearch: webSearchEnabled },
    });
  };

  // Handle initial query from prop (passed from Server Component)
  useEffect(() => {
    if (initialSentRef.current || !initialQuery) return;

    console.log("[ChatProvider] Sending initial query:", {
      conversationId,
      initialQuery,
      model,
      webSearchEnabled,
    });

    initialSentRef.current = true;
    sendMessageWithFiles(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, initialQuery]);

  const state: ChatState = {
    conversationId,
    model,
    webSearchEnabled,
    messages,
    status,
    isLoadingHistory,
  };

  const actions: ChatActions = {
    setWebSearchEnabled,
    setModel,
    sendMessage: sendMessageWithFiles,
  };

  const meta: ChatMeta = {
    initialSentRef,
  };

  return <ChatContext value={{ state, actions, meta }}>{children}</ChatContext>;
}

// ─── Hook to Access Context ───────────────────────────────────────────────────

export function useChatContext(): ChatContextValue {
  const context = use(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
}
