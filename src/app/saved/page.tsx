"use client";

import { FolderOpen, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CollectionList } from "@/components/collection-list";
import { CreateCollectionDialog } from "@/components/create-collection-dialog";
import { SavedPaperCard } from "@/components/saved-paper-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollections } from "@/hooks/use-collections";
import type { SavedPaper } from "@/hooks/use-saved-papers";
import { useSavedPapers } from "@/hooks/use-saved-papers";
import { authClient } from "@/lib/auth/client";

// Grouped paper type - combines duplicate papers into one with all their collections
export interface GroupedPaper {
  catalogId: number;
  title: string;
  author: string | null;
  abstract: string | null;
  publicationYear: number | null;
  catalogType: string | null;
  accessLink: string | null;
  // All saved paper entries for this catalog item (one per collection)
  savedPapers: Array<{
    id: number;
    collectionId: number | null;
    note: string | null;
    createdAt: string;
  }>;
}

// Helper to group papers by catalogId
function groupPapersByCatalog(papers: SavedPaper[]): GroupedPaper[] {
  const grouped = new Map<number, GroupedPaper>();

  for (const paper of papers) {
    const existing = grouped.get(paper.catalogId);

    if (existing) {
      // Add to existing group's saved papers array
      existing.savedPapers.push({
        id: paper.id,
        collectionId: paper.collectionId,
        note: paper.note,
        createdAt: paper.createdAt,
      });
    } else {
      // Create new group
      grouped.set(paper.catalogId, {
        catalogId: paper.catalogId,
        title: paper.title,
        author: paper.author,
        abstract: paper.abstract,
        publicationYear: paper.publicationYear,
        catalogType: paper.catalogType,
        accessLink: paper.accessLink,
        savedPapers: [
          {
            id: paper.id,
            collectionId: paper.collectionId,
            note: paper.note,
            createdAt: paper.createdAt,
          },
        ],
      });
    }
  }

  return Array.from(grouped.values());
}

export default function SavedPapersPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const {
    savedPapers,
    pagination,
    isLoading: isLoadingPapers,
  } = useSavedPapers({
    collectionId: selectedCollection ?? undefined,
  });

  const {
    collections,
    uncategorizedCount,
    isLoading: isLoadingCollections,
    isCreating,
  } = useCollections();
  // Group papers by catalogId to avoid duplicates
  const groupedPapers = useMemo(
    () => groupPapersByCatalog(savedPapers),
    [savedPapers],
  );

  // Filter grouped papers by search query
  const filteredPapers = useMemo(() => {
    if (!searchQuery) return groupedPapers;

    const query = searchQuery.toLowerCase();
    return groupedPapers.filter(
      (paper) =>
        paper.title.toLowerCase().includes(query) ||
        paper.author?.toLowerCase().includes(query) ||
        paper.savedPapers.some((sp) => sp.note?.toLowerCase().includes(query)),
    );
  }, [groupedPapers, searchQuery]);

  const isLoading = isPending || isLoadingPapers || isLoadingCollections;

  if (!isPending && !session?.user) {
    router.push("/");
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 p-4 hidden md:block">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Collections</h2>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={isCreating}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <CollectionList
              collections={collections}
              uncategorizedCount={uncategorizedCount}
              selectedCollection={selectedCollection}
              onSelect={setSelectedCollection}
            />
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Saved Papers</h1>
              <p className="text-muted-foreground">
                {pagination?.total ?? 0} papers saved
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search saved papers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Papers Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3 rounded-lg border p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No saved papers</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery
                  ? "No papers match your search"
                  : selectedCollection
                    ? "This collection is empty"
                    : "Start saving papers to see them here"}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPapers.map((paper) => (
                <SavedPaperCard key={paper.catalogId} groupedPaper={paper} />
              ))}
            </div>
          )}

          {/* Pagination info */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Showing {filteredPapers.length} of {pagination.total} papers
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Create Collection Dialog */}
      <CreateCollectionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
