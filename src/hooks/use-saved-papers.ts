"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { authClient } from "@/lib/auth/client";

// Types
export interface SavedPaper {
  id: number;
  catalogId: number;
  collectionId: number | null;
  note: string | null;
  createdAt: string;
  // Joined from catalog
  title: string;
  author: string | null;
  abstract: string | null;
  publicationYear: number | null;
  catalogType: string | null;
  accessLink: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseSavedPapersOptions {
  collectionId?: string;
  page?: number;
  limit?: number;
}

interface SavePaperArgs {
  catalogId: number;
  collectionId?: number | null;
  note?: string;
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
 * Hook to manage saved papers with SWR and optimistic updates
 */
export function useSavedPapers(options: UseSavedPapersOptions = {}) {
  const { collectionId, page = 1, limit = 20 } = options;
  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = !isPending && !!session?.user;

  // Build query params
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (collectionId) {
    params.set("collectionId", collectionId);
  }

  // SWR for data fetching
  const { data, error, isLoading, mutate } = useSWR<{
    savedPapers: SavedPaper[];
    pagination: Pagination;
  }>(
    isAuthenticated ? `/api/saved-papers?${params.toString()}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    },
  );

  // Save paper mutation
  const savePaperMutation = useSWRMutation(
    "/api/saved-papers",
    async (url: string, { arg }: { arg: SavePaperArgs }) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save paper");
      }
      return res.json();
    },
    {
      onSuccess: () => {
        // Revalidate saved papers
        mutate();
      },
    },
  );

  // Unsave paper mutation
  const unsavePaperMutation = useSWRMutation(
    "/api/saved-papers",
    async (_url: string, { arg }: { arg: { id: number } }) => {
      const res = await fetch(`/api/saved-papers/${arg.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to unsave paper");
      }
      return res.json();
    },
    {
      onSuccess: () => {
        // Revalidate saved papers
        mutate();
      },
    },
  );

  // Update note mutation
  const updateNoteMutation = useSWRMutation(
    "/api/saved-papers",
    async (
      _url: string,
      { arg }: { arg: { id: number; note: string | null } },
    ) => {
      const res = await fetch(`/api/saved-papers/${arg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: arg.note }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update note");
      }
      return res.json();
    },
    {
      onSuccess: () => {
        // Revalidate saved papers
        mutate();
      },
    },
  );

  // Move paper to collection mutation
  const movePaperMutation = useSWRMutation(
    "/api/saved-papers",
    async (
      _url: string,
      { arg }: { arg: { id: number; collectionId: number | null } },
    ) => {
      const res = await fetch(`/api/saved-papers/${arg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId: arg.collectionId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to move paper");
      }
      return res.json();
    },
    {
      onSuccess: () => {
        // Revalidate saved papers
        mutate();
      },
    },
  );

  return {
    savedPapers: data?.savedPapers ?? [],
    pagination: data?.pagination,
    isLoading: isLoading || isPending,
    error,
    savePaper: savePaperMutation.trigger,
    unsavePaper: unsavePaperMutation.trigger,
    updateNote: updateNoteMutation.trigger,
    movePaper: movePaperMutation.trigger,
    isSaving: savePaperMutation.isMutating,
    isUnsaving: unsavePaperMutation.isMutating,
    isUpdating: updateNoteMutation.isMutating || movePaperMutation.isMutating,
    mutate,
  };
}
