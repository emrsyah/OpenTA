"use client";

import {
  Calendar,
  Check,
  Edit2,
  ExternalLink,
  FileText,
  FolderOpen,
  FolderSync,
  Loader2,
  MoreVertical,
  Trash2,
  User,
  X,
} from "lucide-react";
import { memo, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useCollections } from "@/hooks/use-collections";
import type { SavedPaper } from "@/hooks/use-saved-papers";
import { useSavedPapers } from "@/hooks/use-saved-papers";
import { MoveToCollectionDialog } from "./move-to-collection-dialog";

interface SavedPaperCardProps {
  paper: SavedPaper;
}

function SavedPaperCardBase({ paper }: SavedPaperCardProps) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(paper.note ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  const { updateNote, unsavePaper, isUpdating, isUnsaving } = useSavedPapers(
    {},
  );
  const { collections } = useCollections();

  // O(1) lookup using Map instead of O(n) find on every render
  const collectionMap = useMemo(
    () => new Map(collections.map((c) => [c.id, c])),
    [collections],
  );

  const collectionName = paper.collectionId
    ? (collectionMap.get(paper.collectionId)?.name ?? "Unknown")
    : "Uncategorized";

  const isProcessing = isUpdating || isUnsaving || isSaving;

  return (
    <>
      <Card className="group relative">
        {/* Dropdown menu */}
        <div className="absolute top-3 right-3 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isProcessing}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditingNote(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsMoveDialogOpen(true)}>
                <FolderSync className="h-4 w-4 mr-2" />
                Move to collection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleUnsave}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-start gap-2 pr-8">
            <CardTitle className="text-base line-clamp-2 flex-1">
              {paper.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              <FolderOpen className="h-3 w-3 mr-1" />
              {collectionName}
            </Badge>
            {paper.catalogType && (
              <Badge variant="outline" className="text-xs">
                {paper.catalogType}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-3">
          {/* Author and Year */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {paper.author && (
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <span className="truncate max-w-[150px]">{paper.author}</span>
              </div>
            )}
            {paper.publicationYear && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{paper.publicationYear}</span>
              </div>
            )}
          </div>

          {/* Abstract */}
          {paper.abstract && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {paper.abstract}
            </p>
          )}

          {/* Note section */}
          <div className="pt-2 border-t">
            {isEditingNote ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a personal note..."
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                  disabled={isSaving}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveNote}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            ) : paper.note ? (
              <button
                type="button"
                className="w-full text-sm text-muted-foreground bg-muted/50 rounded-md p-2 cursor-pointer hover:bg-muted/70 transition-colors text-left"
                onClick={() => setIsEditingNote(true)}
              >
                <div className="flex items-start gap-1.5">
                  <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <p className="line-clamp-3">{paper.note}</p>
                </div>
              </button>
            ) : (
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                onClick={() => setIsEditingNote(true)}
              >
                <Edit2 className="h-3.5 w-3.5" />
                Add note
              </button>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          {paper.accessLink ? (
            <Button asChild size="sm" className="w-full">
              <a
                href={paper.accessLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Access Paper
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="w-full" disabled>
              Not available
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Move to Collection Dialog */}
      <MoveToCollectionDialog
        open={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        paper={paper}
      />
</>
);
}

// Memoize to prevent re-renders when parent updates but paper prop hasn't changed
export const SavedPaperCard = memo(SavedPaperCardBase);
