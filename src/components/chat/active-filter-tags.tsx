// ───────────────────────────────────────────────────────────────────────────────
// Active Filter Tags: Display and remove currently active filters
// ───────────────────────────────────────────────────────────────────────────────

"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChatFilters } from "./chat-filter-types";
import { getCatalogTypeLabel } from "./chat-filter-types";

export interface ActiveFilterTagsProps {
  filters: ChatFilters;
  onChange: (filters: ChatFilters) => void;
  className?: string;
}

interface FilterTag {
  key: string;
  label: string;
  remove: () => void;
}

export function ActiveFilterTags({
  filters,
  onChange,
  className,
}: ActiveFilterTagsProps) {
  const tags: FilterTag[] = [];

  if (filters.catalogType) {
    tags.push({
      key: "catalogType",
      label: `Type: ${getCatalogTypeLabel(filters.catalogType)}`,
      remove: () => {
        const { catalogType, ...rest } = filters;
        onChange(rest);
      },
    });
  }

  if (filters.yearFrom && filters.yearTo) {
    tags.push({
      key: "yearRange",
      label: `Years: ${filters.yearFrom}-${filters.yearTo}`,
      remove: () => {
        const { yearFrom, yearTo, ...rest } = filters;
        onChange(rest);
      },
    });
  } else if (filters.yearFrom) {
    tags.push({
      key: "yearFrom",
      label: `From: ${filters.yearFrom}`,
      remove: () => {
        const { yearFrom, ...rest } = filters;
        onChange(rest);
      },
    });
  } else if (filters.yearTo) {
    tags.push({
      key: "yearTo",
      label: `Until: ${filters.yearTo}`,
      remove: () => {
        const { yearTo, ...rest } = filters;
        onChange(rest);
      },
    });
  }

  if (filters.author) {
    tags.push({
      key: "author",
      label: `Author: ${filters.author}`,
      remove: () => {
        const { author, ...rest } = filters;
        onChange(rest);
      },
    });
  }

  if (filters.hasElectronicAccess) {
    tags.push({
      key: "hasElectronicAccess",
      label: "Online Access Only",
      remove: () => {
        const { hasElectronicAccess, ...rest } = filters;
        onChange(rest);
      },
    });
  }

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => (
        <Badge
          key={tag.key}
          variant="secondary"
          className="group flex items-center gap-1 pr-1.5 cursor-pointer hover:bg-secondary/80 transition-colors"
        >
          <span className="text-xs">{tag.label}</span>
          <button
            type="button"
            onClick={tag.remove}
            className="ml-1 p-0.5 rounded-full hover:bg-background/80 transition-colors"
            aria-label={`Remove ${tag.label} filter`}
          >
            <X
              size={12}
              className="text-muted-foreground group-hover:text-foreground"
            />
          </button>
        </Badge>
      ))}
    </div>
  );
}
