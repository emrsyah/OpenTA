"use client";

import { Filter, Tag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFilters } from "./filter-context";

export function ActiveFiltersBadges() {
  const { state, actions, meta } = useFilters();

  if (!meta.hasActiveFilters) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Active Filter Badges */}
      <div className="flex flex-wrap gap-1.5">
        {state.catalogType !== "all" && (
          <Badge
            variant="secondary"
            className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/20"
          >
            <Filter className="w-2.5 h-2.5 mr-1 opacity-70 shrink-0" />
            <span className="truncate max-w-[120px]">
              {state.catalogType.replace("Karya Ilmiah - ", "").slice(0, 15)}
            </span>
            <button
              onClick={() => actions.setCatalogType("all")}
              className="ml-1 hover:bg-primary/10 rounded-full p-0.5 shrink-0"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </Badge>
        )}
        {state.yearFrom !== "any" && (
          <Badge
            variant="secondary"
            className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider"
          >
            From {state.yearFrom}
            <button
              onClick={() => actions.setYearFrom("any")}
              className="ml-1 hover:bg-muted/20 rounded-full p-0.5 shrink-0"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </Badge>
        )}
        {state.yearTo !== "any" && (
          <Badge
            variant="secondary"
            className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider"
          >
            To {state.yearTo}
            <button
              onClick={() => actions.setYearTo("any")}
              className="ml-1 hover:bg-muted/20 rounded-full p-0.5 shrink-0"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </Badge>
        )}
        {state.subject !== "all" && (
          <Badge
            variant="secondary"
            className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider bg-orange-500/5 text-orange-600 border-orange-500/20 dark:text-orange-400"
          >
            <Tag className="w-2.5 h-2.5 mr-1 opacity-70 shrink-0" />
            <span className="truncate max-w-[100px]">
              {state.subject.slice(0, 12)}
            </span>
            <button
              onClick={() => actions.setSubject("all")}
              className="ml-1 hover:bg-orange-500/10 rounded-full p-0.5 shrink-0"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </Badge>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Clear Filters Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={actions.clearFilters}
        className="h-7 px-2 text-[10px] font-semibold text-primary hover:text-primary/80 hover:bg-primary/5"
      >
        <X className="w-3 h-3 mr-1" />
        Clear
      </Button>
    </div>
  );
}
