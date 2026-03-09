"use client";

import useSWR from "swr";
import { authClient } from "@/lib/auth/client";

// Types
export interface SaveStatus {
  isSaved: boolean;
  savedPaperId: number | null;
  collectionIds: number[];
  savedPaperIds?: Array<{ id: number; collectionId: number | null }>;
}

// Fetcher
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch");
  }
  return res.json();
};

/**
 * Hook to check if a paper is saved (lightweight check for bookmark icon display)
 */
export function useSaveStatus(catalogId: number | null | undefined) {
  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = !isPending && !!session?.user;

  // SWR for save status - only fetch if catalogId is valid and user is authenticated
  const { data, error, isLoading, mutate } = useSWR<SaveStatus>(
    isAuthenticated && catalogId
      ? `/api/saved-papers/status?catalogId=${catalogId}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Cache for 30 seconds
    },
  );

  return {
    isSaved: data?.isSaved ?? false,
    savedPaperId: data?.savedPaperId ?? null,
    collectionIds: data?.collectionIds ?? [],
    savedPaperIds: data?.savedPaperIds ?? [],
    isLoading: isLoading || isPending,
    error,
    mutate,
  };
}

/**
 * Hook to check save status for multiple papers
 * Useful for list views where you need to show save status for many items
 */
export function useSaveStatusBatch(catalogIds: number[]) {
  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = !isPending && !!session?.user;

  // Create a stable key for the array of IDs
  const idsKey = catalogIds.sort((a, b) => a - b).join(",");

  // Fetch all statuses - we'll need to implement a batch endpoint if needed
  // For now, this is a placeholder that could be optimized with a batch API
  const { data, error, isLoading, mutate } = useSWR<Map<number, SaveStatus>>(
    isAuthenticated && idsKey
      ? `/api/saved-papers/status?catalogIds=${idsKey}`
      : null,
    async (url: string) => {
      // For now, fetch individually - could be optimized with a batch endpoint
      const statuses = new Map<number, SaveStatus>();
      const ids = url.split("catalogIds=")[1]?.split(",").map(Number) || [];

      await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(`/api/saved-papers/status?catalogId=${id}`);
            if (res.ok) {
              const data = await res.json();
              statuses.set(id, data);
            }
          } catch {
            // Silently fail for individual items
          }
        }),
      );

      return statuses;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  return {
    saveStatuses: data ?? new Map(),
    isLoading: isLoading || isPending,
    error,
    mutate,
    getStatus: (catalogId: number): SaveStatus => {
      return (
        data?.get(catalogId) ?? {
          isSaved: false,
          savedPaperId: null,
          collectionIds: [],
        }
      );
    },
  };
}
