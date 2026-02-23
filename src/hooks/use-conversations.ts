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
let initialLoading = true;
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
      initialLoading = false;
      notifyListeners();
      return;
    }

    const fetchConversations = async () => {
      try {
        const response = await fetch("/api/conversations?limit=10");
        if (response.ok) {
          const data = await response.json();
          const dbConversations = (data.conversations || []).map(
            (conv: Conversation) => ({
              ...conv,
              title: conv.title === "New Chat" ? null : conv.title,
            }),
          );

          // Merge strategy: preserve optimistic conversations not yet in DB
          const optimisticIds = new Set(
            globalConversations
              .filter((c) => c.title === null)
              .map((c) => c.id)
          );

          const dbMap = new Map(dbConversations.map((c: Conversation) => [c.id, c]));

          const merged: Conversation[] = [];
          const seen = new Set<string>();

          for (const dbConv of dbConversations) {
            merged.push(dbConv);
            seen.add(dbConv.id);
          }

          for (const optConv of globalConversations) {
            if (optConv.title === null && !seen.has(optConv.id)) {
              merged.push(optConv);
              seen.add(optConv.id);
            }
          }

          merged.sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

          globalConversations = merged;
          notifyListeners();
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        initialLoading = false;
        notifyListeners();
      }
    };

    fetchConversations();
  }, [isAuthenticated]);

  return {
    conversations: globalConversations,
    isLoading: initialLoading && isAuthenticated,
    addOptimisticConversation: (id: string) => {
      // Check if already exists to avoid duplicates
      if (globalConversations.find((c) => c.id === id)) {
        return;
      }
      // Add to beginning with null title (skeleton state)
      const newConversation: Conversation = {
        id,
        title: null, // null = skeleton/loading state
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      globalConversations = [newConversation, ...globalConversations];
      notifyListeners();
    },
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
          const dbConversations = (data.conversations || []).map(
            (conv: Conversation) => ({
              ...conv,
              title: conv.title === "New Chat" ? null : conv.title,
            }),
          );

          // Merge strategy: preserve optimistic conversations not yet in DB
          // Identify optimistic conversations (title === null)
          const optimisticIds = new Set(
            globalConversations
              .filter((c) => c.title === null)
              .map((c) => c.id)
          );

          // Create a map of DB conversations for O(1) lookup
          const dbMap = new Map(dbConversations.map((c: Conversation) => [c.id, c]));

          // Merge: start with DB conversations, add optimistic ones not in DB
          const merged: Conversation[] = [];
          const seen = new Set<string>();

          // Add all DB conversations first
          for (const dbConv of dbConversations) {
            merged.push(dbConv);
            seen.add(dbConv.id);
          }

          // Add optimistic conversations that aren't in DB yet
          for (const optConv of globalConversations) {
            if (optConv.title === null && !seen.has(optConv.id)) {
              merged.push(optConv);
              seen.add(optConv.id);
            }
          }

          // Sort by updatedAt (newest first)
          merged.sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

          globalConversations = merged;
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
