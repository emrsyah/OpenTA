"use client";

import { Bookmark, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCollections } from "@/hooks/use-collections";
import { useSaveStatus } from "@/hooks/use-save-status";
import { useSavedPapers } from "@/hooks/use-saved-papers";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { CollectionPicker } from "./collection-picker";

interface SaveButtonProps {
  catalogId: number;
  variant?: "icon" | "badge" | "button";
  size?: "sm" | "md";
  className?: string;
  paperTitle?: string;
  onLoginRequired?: () => void;
}

export function SaveButton({
  catalogId,
  variant = "icon",
  size = "md",
  className,
  paperTitle,
  onLoginRequired,
}: SaveButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const { data: session, isPending: isAuthPending } = authClient.useSession();
  const isAuthenticated = !isAuthPending && !!session?.user;

  const {
    isSaved,
    savedPaperId,
    savedPaperIds,
    isLoading: isStatusLoading,
    mutate: mutateStatus,
  } = useSaveStatus(catalogId);
  const { savePaper, unsavePaper, isSaving, isUnsaving } = useSavedPapers({});
  const { collections } = useCollections();

  // O(1) lookup using Map instead of O(n) find on every render
  const collectionMap = useMemo(
    () => new Map(collections.map((c) => [c.id, c])),
    [collections],
  );

  const getCollectionName = (collectionId: number | null): string => {
    if (collectionId === null) return "Uncategorized";
    return collectionMap.get(collectionId)?.name ?? "Unknown";
  };

  // Loading state
  if (isLoading) {
    if (variant === "icon") {
      return (
        <Button
          variant="ghost"
          size={size === "sm" ? "icon-xs" : "icon-sm"}
          className={cn("text-muted-foreground", className)}
          disabled
        >
          <Loader2 className="h-4 w-4 animate-spin" />
        </Button>
      );
    }
    return null;
  }

  // Icon variant - just a bookmark icon
  if (variant === "icon") {
    if (isSaved) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size={size === "sm" ? "icon-xs" : "icon-sm"}
              className={cn("text-primary hover:text-primary", className)}
              disabled={isProcessing}
            >
              <Bookmark className="h-4 w-4 fill-current" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Saved to</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {savedPaperIds?.map(({ id, collectionId }) => (
              <DropdownMenuItem
                key={id}
                className="flex items-center justify-between"
              >
                <span className="truncate">
                  {getCollectionName(collectionId)}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnsaveFromCollection(id);
                  }}
                >
                  <span className="text-xs">×</span>
                </Button>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowPicker(true)}>
              Save to another collection...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <>
        <Button
          variant="ghost"
          size={size === "sm" ? "icon-xs" : "icon-sm"}
          className={cn("text-muted-foreground hover:text-primary", className)}
          onClick={() => {
            if (!isAuthenticated) {
              onLoginRequired?.();
              return;
            }
            setShowPicker(true);
          }}
          disabled={isProcessing}
        >
          <Bookmark className="h-4 w-4" />
        </Button>

        <CollectionPicker
          open={showPicker}
          onOpenChange={setShowPicker}
          catalogId={catalogId}
          paperTitle={paperTitle}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </>
    );
  }

  // Badge variant - inline badge style
  if (variant === "badge") {
    return (
      <>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors",
            isSaved
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
            className,
          )}
          onClick={() => {
            if (!isAuthenticated) {
              onLoginRequired?.();
              return;
            }
            if (isSaved) {
              handleUnsave();
            } else {
              setShowPicker(true);
            }
          }}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Bookmark className={cn("h-3 w-3", isSaved && "fill-current")} />
          )}
          <span>{isSaved ? "Saved" : "Save"}</span>
        </button>

        <CollectionPicker
          open={showPicker}
          onOpenChange={setShowPicker}
          catalogId={catalogId}
          paperTitle={paperTitle}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </>
    );
  }

  // Button variant - full button
  return (
    <>
      <Button
        variant={isSaved ? "default" : "outline"}
        size={size === "sm" ? "sm" : "default"}
        className={className}
        onClick={() => {
          if (!isAuthenticated) {
            onLoginRequired?.();
            return;
          }
          if (isSaved) {
            handleUnsave();
          } else {
            setShowPicker(true);
          }
        }}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
        )}
        {isSaved ? "Saved" : "Save"}
      </Button>

      <CollectionPicker
        open={showPicker}
        onOpenChange={setShowPicker}
        catalogId={catalogId}
        paperTitle={paperTitle}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </>
  );
}
