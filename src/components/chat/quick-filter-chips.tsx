// ───────────────────────────────────────────────────────────────────────────────
// Quick Filter Chips: Common one-click filter shortcuts
// ───────────────────────────────────────────────────────────────────────────────

"use client";

import { cn } from "@/lib/utils";
import type { CatalogType, ChatFilters } from "./chat-filter-types";

export interface QuickFilterChipsProps {
  filters: ChatFilters;
  onChange: (filters: ChatFilters) => void;
  className?: string;
}

interface QuickFilter {
  id: string;
  label: string;
  icon?: string;
  getIsActive: (filters: ChatFilters) => boolean;
  apply: (filters: ChatFilters) => ChatFilters;
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    id: "thesis-s2",
    label: "Thesis Only",
    getIsActive: (filters) =>
      filters.catalogType === "Karya Ilmiah - Thesis (S2) - Reference",
    apply: (filters) => ({
      ...filters,
      catalogType: "Karya Ilmiah - Thesis (S2) - Reference" as CatalogType,
    }),
  },
  {
    id: "skripsi-s1",
    label: "Skripsi Only",
    getIsActive: (filters) =>
      filters.catalogType === "Karya Ilmiah - Skripsi (S1) - Reference",
    apply: (filters) => ({
      ...filters,
      catalogType: "Karya Ilmiah - Skripsi (S1) - Reference" as CatalogType,
    }),
  },
  {
    id: "recent-5",
    label: "Recent (5 Years)",
    getIsActive: (filters) => {
      const currentYear = new Date().getFullYear();
      return (
        filters.yearFrom === currentYear - 5 && filters.yearTo === currentYear
      );
    },
    apply: (filters) => {
      const currentYear = new Date().getFullYear();
      return {
        ...filters,
        yearFrom: currentYear - 5,
        yearTo: currentYear,
      };
    },
  },
  {
    id: "recent-10",
    label: "Recent (10 Years)",
    getIsActive: (filters) => {
      const currentYear = new Date().getFullYear();
      return (
        filters.yearFrom === currentYear - 10 && filters.yearTo === currentYear
      );
    },
    apply: (filters) => {
      const currentYear = new Date().getFullYear();
      return {
        ...filters,
        yearFrom: currentYear - 10,
        yearTo: currentYear,
      };
    },
  },
  {
    id: "online-access",
    label: "Online Access",
    getIsActive: (filters) => filters.hasElectronicAccess === true,
    apply: (filters) => ({
      ...filters,
      hasElectronicAccess: true,
    }),
  },
  {
    id: "jurnal-internasional",
    label: "Jurnal Internasional",
    getIsActive: (filters) =>
      filters.catalogType === "Jurnal Internasional - Reference",
    apply: (filters) => ({
      ...filters,
      catalogType: "Jurnal Internasional - Reference" as CatalogType,
    }),
  },
  {
    id: "ebook",
    label: "E-Book",
    getIsActive: (filters) =>
      filters.catalogType === "Buku - Elektronik (E-Book)",
    apply: (filters) => ({
      ...filters,
      catalogType: "Buku - Elektronik (E-Book)" as CatalogType,
    }),
  },
];

export function QuickFilterChips({
  filters,
  onChange,
  className,
}: QuickFilterChipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {QUICK_FILTERS.map((filter) => {
        const isActive = filter.getIsActive(filters);
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => {
              if (isActive) {
                // Remove this filter
                const newFilters = { ...filters };
                if (filter.id.startsWith("recent-")) {
                  delete newFilters.yearFrom;
                  delete newFilters.yearTo;
                } else if (filter.id === "online-access") {
                  delete newFilters.hasElectronicAccess;
                } else {
                  delete newFilters.catalogType;
                }
                onChange(newFilters);
              } else {
                onChange(filter.apply(filters));
              }
            }}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full transition-all duration-200 border",
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
            )}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
