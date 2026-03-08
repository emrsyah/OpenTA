"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { authClient } from "@/lib/auth/client";

// Types
export interface Collection {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  isDefault: boolean;
  paperCount: number;
  createdAt: string;
}

interface CreateCollectionArgs {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

interface UpdateCollectionArgs {
  id: number;
  name?: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
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
 * Hook to manage collections with SWR and CRUD operations
 */
export function useCollections() {
  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = !isPending && !!session?.user;

  // SWR for collections list
  const { data, error, isLoading, mutate } = useSWR<{
    collections: Collection[];
    uncategorizedCount: number;
  }>(isAuthenticated ? "/api/collections" : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  // Create collection mutation
  const createMutation = useSWRMutation(
    "/api/collections",
    async (url: string, { arg }: { arg: CreateCollectionArgs }) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create collection");
      }
      return res.json();
    },
    {
      onSuccess: () => {
        // Revalidate collections
        mutate();
      },
    },
  );

  // Update collection mutation
  const updateMutation = useSWRMutation(
    "/api/collections",
    async (_url: string, { arg }: { arg: UpdateCollectionArgs }) => {
      const res = await fetch(`/api/collections/${arg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: arg.name,
          description: arg.description,
          color: arg.color,
          icon: arg.icon,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update collection");
      }
      return res.json();
    },
    {
      onSuccess: () => {
        // Revalidate collections
        mutate();
      },
    },
  );

  // Delete collection mutation
  const deleteMutation = useSWRMutation(
    "/api/collections",
    async (_url: string, { arg }: { arg: { id: number } }) => {
      const res = await fetch(`/api/collections/${arg.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete collection");
      }
      return res.json();
    },
    {
      onSuccess: () => {
        // Revalidate collections
        mutate();
      },
    },
  );

  return {
    collections: data?.collections ?? [],
    uncategorizedCount: data?.uncategorizedCount ?? 0,
    isLoading: isLoading || isPending,
    error,
    createCollection: createMutation.trigger,
    updateCollection: updateMutation.trigger,
    deleteCollection: deleteMutation.trigger,
    isCreating: createMutation.isMutating,
    isUpdating: updateMutation.isMutating,
    isDeleting: deleteMutation.isMutating,
    mutate,
  };
}
