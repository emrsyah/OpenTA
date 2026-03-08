"use client";

import { Check, Folder, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import type { SavedPaper } from "@/hooks/use-saved-papers";
import { useSavedPapers } from "@/hooks/use-saved-papers";
import { cn } from "@/lib/utils";

interface MoveToCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paper: SavedPaper | null;
}

export function MoveToCollectionDialog({
  open,
  onOpenChange,
  paper,
}: MoveToCollectionDialogProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    number | null
  >(paper?.collectionId ?? null);

  const { collections } = useCollections();
  const { movePaper, isUpdating } = useSavedPapers({});

  const handleMove = async () => {
    if (!paper) return;

    try {
      await movePaper({
        id: paper.id,
        collectionId: selectedCollectionId,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to move paper:", error);
    }
  };

  const handleClose = () => {
    setSelectedCollectionId(paper?.collectionId ?? null);
    onOpenChange(false);
  };

  // Reset selection when paper or dialog opens
  useEffect(() => {
    if (open) {
      setSelectedCollectionId(paper?.collectionId ?? null);
    }
  }, [open, paper?.collectionId]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move to Collection</DialogTitle>
          {paper && (
            <DialogDescription className="line-clamp-2">
              Move "{paper.title}" to a different collection
            </DialogDescription>
          )}
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
              {selectedCollectionId === null && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>

            {/* User collections */}
            {collections.map((collection) => (
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
                <span className="text-xs text-muted-foreground">
                  {collection.paperCount}
                </span>
                {selectedCollectionId === collection.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}

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
          <Button
            onClick={handleMove}
            disabled={
              isUpdating ||
              selectedCollectionId === paper?.collectionId ||
              !paper
            }
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Moving...
              </>
            ) : (
              "Move"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
