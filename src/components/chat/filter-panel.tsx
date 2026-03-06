// ───────────────────────────────────────────────────────────────────────────────
// Filter Panel: Comprehensive filter controls for RAG chat
// ───────────────────────────────────────────────────────────────────────────────

"use client";

import { FilterIcon, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { PromptInputButton } from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CATALOG_TYPE_OPTIONS,
  type CatalogType,
  type ChatFilters,
  YEAR_PRESETS,
} from "./chat-filter-types";

export interface FilterPanelProps {
  filters: ChatFilters;
  onChange: (filters: ChatFilters) => void;
  onClear: () => void;
  className?: string;
}

export function FilterPanel({
  filters,
  onChange,
  onClear,
  className,
}: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<ChatFilters>(filters);

  // Reset local filters when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setLocalFilters(filters);
    }
  };

  const handleApply = () => {
    onChange(localFilters);
    setOpen(false);
  };

  const handleClear = () => {
    setLocalFilters({});
    onClear();
  };

  const hasActiveFilters = !!(
    filters.catalogType ||
    filters.yearFrom ||
    filters.yearTo ||
    filters.author ||
    filters.hasElectronicAccess
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <PromptInputButton
          tooltip={{ content: "Filter papers" }}
          variant={hasActiveFilters ? "default" : "ghost"}
          className={cn(
            hasActiveFilters && "bg-primary text-primary-foreground",
            className,
          )}
          type="button"
        >
          <FilterIcon size={16} />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="ml-1 text-xs bg-primary-foreground/20 px-1.5 py-0.5 rounded-full">
              {
                [
                  filters.catalogType,
                  filters.yearFrom || filters.yearTo,
                  filters.author,
                  filters.hasElectronicAccess,
                ].filter(Boolean).length
              }
            </span>
          )}
        </PromptInputButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal size={18} />
            Filter Papers
          </DialogTitle>
          <DialogDescription>
            Narrow down your search with specific criteria
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Catalog Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="catalog-type">Document Type</Label>
            <Select
              value={localFilters.catalogType || "all"}
              onValueChange={(value) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  catalogType:
                    value === "all" ? undefined : (value as CatalogType),
                }))
              }
            >
              <SelectTrigger id="catalog-type">
                <SelectValue placeholder="Select document type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {CATALOG_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Range Filter */}
          <div className="space-y-3">
            <Label>Publication Year</Label>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Input
                  type="number"
                  placeholder="From"
                  min={1900}
                  max={2100}
                  value={localFilters.yearFrom || ""}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      yearFrom: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                />
              </div>
              <div className="flex items-center text-muted-foreground">-</div>
              <div className="flex-1 space-y-1">
                <Input
                  type="number"
                  placeholder="To"
                  min={1900}
                  max={2100}
                  value={localFilters.yearTo || ""}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      yearTo: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                />
              </div>
            </div>

            {/* Year Presets */}
            <div className="flex flex-wrap gap-2">
              {YEAR_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      yearFrom: preset.from,
                      yearTo: preset.to,
                    }))
                  }
                  className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Author Filter */}
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              placeholder="Filter by author name..."
              value={localFilters.author || ""}
              onChange={(e) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  author: e.target.value || undefined,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Partial match supported (case-insensitive)
            </p>
          </div>

          {/* Electronic Access Filter */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="electronic-access"
              checked={localFilters.hasElectronicAccess || false}
              onCheckedChange={(checked) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  hasElectronicAccess: checked as boolean,
                }))
              }
            />
            <Label
              htmlFor="electronic-access"
              className="text-sm font-normal cursor-pointer"
            >
              Only show papers with online access
            </Label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground"
          >
            <X size={16} className="mr-1" />
            Clear All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>Apply Filters</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
