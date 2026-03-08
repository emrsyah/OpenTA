"use client";

import { Check, Folder, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { GroupedPaper } from "@/app/saved/page";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCollections } from "@/hooks/use-collections";
import { useSavedPapers } from "@/hooks/use-saved-papers";
import { cn } from "@/lib/utils";

interface MoveToCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupedPaper: GroupedPaper;
}

export function MoveToCollectionDialog({
  open,
  onOpenChange,
  groupedPaper,
}: MoveToCollectionDialogProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    number | null
  >(null);

  const { collections } = useCollections();
  const { movePaper, isUpdating } = useSavedPapers({});

  // Get current collection IDs

  // Get current collection IDs that the paper is saved to
  const existingCollectionIds = groupedPaper.savedPapers
    .map((sp) => sp.collectionId)
    .filter((id): id is number => id !== null);

  const handleMove = async () => {
    try {
      // For each saved paper entry, move it to the new collection
      // or remove it if it's already in that collection
      for (const sp of groupedPaper.savedPapers) {
        if (sp.collectionId === selectedCollectionId) {
          // Already in this collection, skip
          continue;
        }

        if (selectedCollectionId === null) {
          // Moving to uncategorized
          await movePaper({ id: sp.id, collectionId: null });
        } else if (sp.collectionId === null) {
          // Moving from uncategorized to a collection
          await movePaper({ id: sp.id, collectionId: selectedCollectionId });
        } else {
          // Moving between collections - remove from old and add to new
          // Actually just move it
          await movePaper({ id: sp.id, collectionId: selectedCollectionId });
        }
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to move paper:", error);
    }
  };

  const handleClose = () => {
    // Reset to first existing collection
    setSelectedCollectionId(existingCollectionIds[0] ?? null);
    onOpenChange(false);
  };

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedCollectionId(existingCollectionIds[0] ?? null);
    }
  }, [open, existingCollectionIds]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Collections</DialogTitle>
          <DialogDescription className="line-clamp-2">
            Move &quot;{groupedPaper.title}&quot; to a different collection
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="max-h-64 overflow-y-auto space-y-1 rounded-md border p-2">
            {/* Uncategorized option */}
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                selectedCollectionId === null && "bg-accent",
              )}
              onClick={() => setSelectedCollectionId(null)}
              disabled={isUpdating}
            >
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-left">Uncategorized</span>
              {existingCollectionIds.includes(-1) && (
                <span className="text-xs text-primary">Saved</span>
              )}
              {selectedCollectionId === null && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>

            {/* User collections */}
            {collections.map((collection) => {
              const isAlreadySaved = existingCollectionIds.includes(
                collection.id,
              );
              return (
                <button
                  key={collection.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                    selectedCollectionId === collection.id && "bg-accent",
                  )}
                  onClick={() => setSelectedCollectionId(collection.id)}
                  disabled={isUpdating}
                >
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: collection.color ?? "#888" }}
                  />
                  <span className="flex-1 text-left truncate">
                    {collection.name}
                  </span>
                  {isAlreadySaved ? (
                    <span className="text-xs text-primary font-medium">
                      Saved
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {collection.paperCount}
                    </span>
                  )}
                  {selectedCollectionId === collection.id &&
                    !isAlreadySaved && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                </button>
              );
            })}

            {collections.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No collections yet. Create one first.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
