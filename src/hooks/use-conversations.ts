"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";

export interface Conversation {
  id: string;
  title: string | null; // null means skeleton/loading state
  createdAt: string;
  updatedAt: string;
}

let globalConversations: Conversation[] = [];
const listeners: Set<() => void> = new Set();

/**
 * Global hook to manage conversations state across components
 * This allows the chat page and sidebar to stay in sync
 */
export function useConversations() {
  const [, forceUpdate] = useState({});
  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = !isPending && session?.user;

  // Subscribe to changes
  useEffect(() => {
    const listener = () => {
      forceUpdate({});
    };

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Fetch conversations on mount (only for authenticated users)
  useEffect(() => {
    if (!isAuthenticated) {
      globalConversations = [];
      notifyListeners();
      return;
    }

    const fetchConversations = async () => {
      try {
        const response = await fetch("/api/conversations?limit=10");
        if (response.ok) {
          const data = await response.json();
          // Treat "New Chat" as skeleton (null) to show loading state
          globalConversations = (data.conversations || []).map(
            (conv: Conversation) => ({
              ...conv,
              title: conv.title === "New Chat" ? null : conv.title,
            }),
          );
          notifyListeners();
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      }
    };

    fetchConversations();
  }, [isAuthenticated]);

  return {
    conversations: globalConversations,
    updateConversationTitle: (id: string, title: string) => {
      const index = globalConversations.findIndex((c) => c.id === id);
      if (index !== -1) {
        globalConversations[index] = {
          ...globalConversations[index],
          title,
          updatedAt: new Date().toISOString(),
        };
        notifyListeners();
      }
    },
    removeConversation: (id: string) => {
      globalConversations = globalConversations.filter((c) => c.id !== id);
      notifyListeners();
    },
    refresh: async () => {
      if (!isAuthenticated) return;
      try {
        const response = await fetch("/api/conversations?limit=10");
        if (response.ok) {
          const data = await response.json();
          // Treat "New Chat" as skeleton (null) to show loading state
          globalConversations = (data.conversations || []).map(
            (conv: Conversation) => ({
              ...conv,
              title: conv.title === "New Chat" ? null : conv.title,
            }),
          );
          notifyListeners();
        }
      } catch (error) {
        console.error("Failed to refresh conversations:", error);
      }
    },
  };
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}
