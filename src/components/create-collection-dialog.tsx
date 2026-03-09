"use client";

import { Loader2 } from "lucide-react";
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

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (collectionId: number) => void;
}

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCollectionDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const { createCollection, isCreating } = useCollections();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Collection name is required");
      return;
    }

    if (name.length > 100) {
      setError("Collection name must be less than 100 characters");
      return;
    }

    try {
      const result = await createCollection({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });

      if (result?.collection?.id) {
        onSuccess?.(result.collection.id);
      }

      // Reset form
      setName("");
      setDescription("");
      setColor(PRESET_COLORS[0]);
      onOpenChange(false);
    } catch (err) {
      setError("Failed to create collection. Please try again.");
      console.error("Failed to create collection:", err);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setColor(PRESET_COLORS[0]);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
            <DialogDescription>
              Organize your saved papers into collections for easy access.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Machine Learning Papers"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground">
                {name.length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="What's this collection about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isCreating}
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full transition-transform hover:scale-110",
                      color === presetColor &&
                        "ring-2 ring-offset-2 ring-primary",
                    )}
                    style={{ backgroundColor: presetColor }}
                    onClick={() => setColor(presetColor)}
                    disabled={isCreating}
                  />
                ))}
              </div>
            </div>

            {/* Error */}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Collection"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
