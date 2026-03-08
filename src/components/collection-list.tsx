"use client";

import { Folder, Inbox } from "lucide-react";
import type { Collection } from "@/hooks/use-collections";
import { cn } from "@/lib/utils";

interface CollectionListProps {
  collections: Collection[];
  uncategorizedCount: number;
  selectedCollection: string | null;
  onSelect: (collectionId: string | null) => void;
}

export function CollectionList({
  collections,
  uncategorizedCount,
  selectedCollection,
  onSelect,
}: CollectionListProps) {
  return (
    <nav className="space-y-1">
      {/* All Saved */}
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
          selectedCollection === null
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-accent text-foreground",
        )}
        onClick={() => onSelect(null)}
      >
        <Inbox className="h-4 w-4" />
        <span className="flex-1 text-left">All Saved</span>
        <span className="text-xs text-muted-foreground">
          {collections.reduce((sum, c) => sum + c.paperCount, 0) +
            uncategorizedCount}
        </span>
      </button>

      {/* Uncategorized */}
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
          selectedCollection === "uncategorized"
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-accent text-foreground",
        )}
        onClick={() => onSelect("uncategorized")}
      >
        <Folder className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-left">Uncategorized</span>
        <span className="text-xs text-muted-foreground">
          {uncategorizedCount}
        </span>
      </button>

      {/* User Collections */}
      {collections.length > 0 && (
        <>
          <div className="h-px bg-border my-2" />
          {collections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                selectedCollection === String(collection.id)
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-accent text-foreground",
              )}
              onClick={() => onSelect(String(collection.id))}
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
            </button>
          ))}
        </>
      )}
    </nav>
  );
}
