"use client";

import { Check, Folder, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCollections } from "@/hooks/use-collections";
import { cn } from "@/lib/utils";

// Preset colors for collections
const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
];

interface CollectionPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogId: number;
  paperTitle?: string;
  onSave: (collectionId: number | null, note?: string) => Promise<void>;
  isSaving?: boolean;
}

export function CollectionPicker({
  open,
  onOpenChange,
  catalogId,
  paperTitle,
  onSave,
  isSaving = false,
}: CollectionPickerProps) {
  const [selectedCollection, setSelectedCollection] = useState<number | null>(
    null,
  );
  const [note, setNote] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState(
    PRESET_COLORS[0],
  );

  const { collections, createCollection, isCreating } = useCollections();

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    try {
      const result = await createCollection({
        name: newCollectionName.trim(),
        color: newCollectionColor,
      });

      // Select the newly created collection
      if (result?.collection?.id) {
        setSelectedCollection(result.collection.id);
      }

      setShowCreateForm(false);
      setNewCollectionName("");
    } catch (error) {
      console.error("Failed to create collection:", error);
    }
  };

  const handleSave = async () => {
    await onSave(selectedCollection, note || undefined);
    // Reset state
    setSelectedCollection(null);
    setNote("");
    setShowCreateForm(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state on close
    setSelectedCollection(null);
    setNote("");
    setShowCreateForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Paper</DialogTitle>
          {paperTitle && (
            <DialogDescription className="line-clamp-2">
              {paperTitle}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!showCreateForm ? (
            <>
              {/* Collection List */}
              <div className="space-y-2">
                <Label>Select Collection</Label>
                <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border p-2">
                  {/* Uncategorized option */}
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                      selectedCollection === null && "bg-accent",
                    )}
                    onClick={() => setSelectedCollection(null)}
                  >
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-left">Uncategorized</span>
                    {selectedCollection === null && (
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
                        selectedCollection === collection.id && "bg-accent",
                      )}
                      onClick={() => setSelectedCollection(collection.id)}
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
                      {selectedCollection === collection.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create new collection */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Collection
              </Button>

              {/* Note input */}
              <div className="space-y-2">
                <Label htmlFor="note">Note (optional)</Label>
                <Textarea
                  id="note"
                  placeholder="Add a personal note about this paper..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </>
          ) : (
            /* Create Collection Form */
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="collectionName">Collection Name</Label>
                <Input
                  id="collectionName"
                  placeholder="Enter collection name..."
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "h-8 w-8 rounded-full transition-transform hover:scale-110",
                        newCollectionColor === color &&
                          "ring-2 ring-offset-2 ring-primary",
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCollectionColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCollection}
                  disabled={!newCollectionName.trim() || isCreating}
                  className="flex-1"
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {!showCreateForm && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
