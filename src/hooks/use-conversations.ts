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
let hasLoadedOnce = false; // Track if we've ever loaded data
let globalOffset = 0;
let globalHasMore = true;
const PAGE_SIZE = 20;
let lastAuthState: boolean | null = null; // Track auth state changes
const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function mergeConversations(
  dbConversations: Conversation[],
  isLoadMore = false,
) {
  if (isLoadMore) {
    // For load more: append to existing, avoid duplicates
    const existingIds = new Set(globalConversations.map((c) => c.id));
    const newConvs = dbConversations.filter((c) => !existingIds.has(c.id));
    globalConversations = [...globalConversations, ...newConvs];
  } else {
    // For refresh/initial: merge with optimistic conversations
    const optimisticIds = new Set(
      globalConversations.filter((c) => c.title === null).map((c) => c.id),
    );

    const merged: Conversation[] = [];
    const seen = new Set<string>();

    // Add DB conversations
    for (const dbConv of dbConversations) {
      merged.push(dbConv);
      seen.add(dbConv.id);
    }

    // Add optimistic conversations not in DB
    for (const optConv of globalConversations) {
      if (optConv.title === null && !seen.has(optConv.id)) {
        merged.push(optConv);
      }
    }

    // Sort by updatedAt (newest first)
    merged.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    globalConversations = merged;
  }

  // Update hasMore based on whether we got a full page
  globalHasMore = dbConversations.length >= PAGE_SIZE;
  notifyListeners();
}

/**
 * Global hook to manage conversations state across components
 * Supports pagination with load more functionality
 */
export function useConversations() {
  const [, forceUpdate] = useState({});
  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = !isPending && !!session?.user;

  // Local state for UI feedback
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  // Reset state when user actually signs out (not just auth revalidation)
  useEffect(() => {
    // Only reset if we're transitioning from authenticated to not authenticated
    // This prevents reset during auth revalidation flickers
    const wasAuthenticated = lastAuthState === true;
    lastAuthState = isAuthenticated;
    
    if (!isAuthenticated && wasAuthenticated) {
      // User actually signed out
      globalConversations = [];
      globalOffset = 0;
      globalHasMore = true;
      initialLoading = true;
      hasLoadedOnce = false;
      notifyListeners();
    }
  }, [isAuthenticated]);

  // Fetch conversations on mount - only if we haven't loaded yet
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Skip fetch if we already have data (prevents re-fetch on auth revalidation)
    if (hasLoadedOnce) return;

    const fetchConversations = async () => {
      try {
        globalOffset = 0;
        const response = await fetch(
          `/api/conversations?limit=${PAGE_SIZE}&offset=0`,
        );
        if (response.ok) {
          const data = await response.json();
          const dbConversations = (data.conversations || []).map(
            (conv: Conversation) => ({
              ...conv,
              title: conv.title === "New Chat" ? null : conv.title,
            }),
          );
          mergeConversations(dbConversations, false);
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        initialLoading = false;
        hasLoadedOnce = true;
        notifyListeners();
      }
    };

    fetchConversations();
  }, [isAuthenticated]);

  const loadMore = async () => {
    if (!isAuthenticated || isLoadingMore || !globalHasMore) return;

    setIsLoadingMore(true);
    const nextOffset = globalOffset + PAGE_SIZE;

    try {
      const response = await fetch(
        `/api/conversations?limit=${PAGE_SIZE}&offset=${nextOffset}`,
      );
      if (response.ok) {
        const data = await response.json();
        const dbConversations = (data.conversations || []).map(
          (conv: Conversation) => ({
            ...conv,
            title: conv.title === "New Chat" ? null : conv.title,
          }),
        );

        globalOffset = nextOffset;
        mergeConversations(dbConversations, true);
      }
    } catch (error) {
      console.error("Failed to load more conversations:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const refresh = async () => {
    if (!isAuthenticated) return;

    try {
      globalOffset = 0;
      const response = await fetch(
        `/api/conversations?limit=${PAGE_SIZE}&offset=0`,
      );
      if (response.ok) {
        const data = await response.json();
        const dbConversations = (data.conversations || []).map(
          (conv: Conversation) => ({
            ...conv,
            title: conv.title === "New Chat" ? null : conv.title,
          }),
        );
        mergeConversations(dbConversations, false);
      }
    } catch (error) {
      console.error("Failed to refresh conversations:", error);
    }
  };

  return {
    conversations: globalConversations,
    // Only show loading state on initial load when we have NO cached data
    // This prevents loading flash on tab/window refocus
    isLoading: initialLoading && isAuthenticated && !hasLoadedOnce,
    isLoadingMore,
    hasMore: globalHasMore,
    loadMore,
    addOptimisticConversation: (id: string) => {
      // Check if already exists to avoid duplicates
      if (globalConversations.find((c) => c.id === id)) {
        return;
      }
      // Add to beginning with null title (skeleton state)
      const newConversation: Conversation = {
        id,
        title: null,
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
    refresh,
  };
}
