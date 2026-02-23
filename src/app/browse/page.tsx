"use client";

import { BookOpen, Grid3x3, List } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ActiveFiltersBadges } from "@/components/browse/active-filters-badges";
import { FilterBar } from "@/components/browse/filter-bar";
import {
  FiltersProvider,
  SORT_OPTIONS,
  useFilters,
} from "@/components/browse/filter-context";
import { ResultsPagination } from "@/components/browse/results-pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import CatalogCard for code splitting
const CatalogCard = dynamic(
  () =>
    import("@/components/catalog-card").then((mod) => ({
      default: mod.CatalogCard,
    })),
  {
    loading: () => (
      <Card className="overflow-hidden">
        <CardHeader>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    ),
    ssr: false,
  },
);

interface CatalogItem {
  id: number;
  title: string;
  abstract: string | null;
  catalogNumber: string | null;
  catalogType: string | null;
  classificationNumber: string | null;
  subject: string | null;
  author: string | null;
  editor: string | null;
  publisher: string | null;
  shelfNumber: string | null;
  libraryLocation: string | null;
  publicationYear: number | null;
  totalCopies: number | null;
  accessLink: string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

// Extract unique subjects from items (optimized with reduce)
const extractSubjects = (items: CatalogItem[]): string[] => {
  return Array.from(
    items
      .flatMap((item) =>
        item.subject
          ? item.subject
              .split(/[,;•/]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      )
      .reduce((set, subject) => set.add(subject), new Set<string>()),
  ).sort();
};

// Sort items client-side
const sortItems = (items: CatalogItem[], sortBy: SortOption): CatalogItem[] => {
  const sorted = [...items];
  switch (sortBy) {
    case "year-desc":
      return sorted.sort(
        (a, b) => (b.publicationYear || 0) - (a.publicationYear || 0),
      );
    case "year-asc":
      return sorted.sort(
        (a, b) => (a.publicationYear || 0) - (b.publicationYear || 0),
      );
    case "title-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "title-desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case "relevance":
    default:
      return sorted; // API handles relevance
  }
};

// ─── Browse Page Component ───────────────────────────────────────────────────────

// Inner Browse Content component that uses the filters context
function BrowseContent() {
  const { state, actions } = useFilters();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [rawItems, setRawItems] = useState<CatalogItem[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState(state.search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(state.search);
    }, 500);

    return () => clearTimeout(timer);
  }, [state.search]);

  // Fetch catalog items
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const { page, limit } = pagination;
        const params = new URLSearchParams({
          search: debouncedSearch,
          type: state.catalogType,
          page: page.toString(),
          limit: limit.toString(),
        });

        if (state.yearFrom && state.yearFrom !== "any")
          params.append("yearFrom", state.yearFrom);
        if (state.yearTo && state.yearTo !== "any")
          params.append("yearTo", state.yearTo);
        if (state.subject && state.subject !== "all")
          params.append("subject", state.subject);

        const response = await fetch(`/api/catalog?${params}`);
        const data = await response.json();

        setRawItems(data.items || []);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Failed to fetch catalog:", error);
        setRawItems([]);
        setPagination((prev) => ({ ...prev, total: 0, totalPages: 0 }));
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [
    debouncedSearch,
    state.catalogType,
    state.yearFrom,
    state.yearTo,
    state.subject,
    pagination.page,
    pagination.limit,
  ]);

  // Sort items and extract subjects whenever raw items change (combined effect)
  useEffect(() => {
    const sorted = sortItems(rawItems, state.sortBy);
    setItems(sorted);
    const subjects = extractSubjects(rawItems);
    setAvailableSubjects(subjects);
  }, [rawItems, state.sortBy]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSortChange = (value: SortOption) => {
    actions.setSortBy(value);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSubjectChange = (value: string) => {
    actions.setSubject(value);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Override the setSubject action to include pagination reset
  const enhancedActions = {
    ...actions,
    setSubject: handleSubjectChange,
  };

  return (
    <div className="min-h-screen bg-background/50">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          {/* Title & Actions Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">
                  Browse Catalog
                </h1>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {loading
                    ? "Discovering items..."
                    : `${pagination.total.toLocaleString()} items`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:inline-block">
                  Sort
                </span>
                <Select value={state.sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[120px] sm:w-[140px] h-8 bg-background shadow-xs text-xs">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center p-0.5 border rounded-lg bg-background shadow-xs">
                <Button
                  variant={state.viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => actions.setViewMode("grid")}
                  className="h-7 w-7 rounded-md"
                  title="Grid View"
                >
                  <Grid3x3 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={state.viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => actions.setViewMode("list")}
                  className="h-7 w-7 rounded-md"
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filters Row 1: Search, Type, Years */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <FilterBar.Search />
            <FilterBar.Type />
            <FilterBar.YearRange />
          </div>

          {/* Filters Row 2: Subject, Badges, Results Count */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <FilterBar.Subject availableSubjects={availableSubjects} />
            <ActiveFiltersBadges />
            <ResultsPagination
              pagination={pagination}
              onPageChange={handlePageChange}
              itemsCount={items.length}
              loading={loading}
            />
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div
            className={
              state.viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <>
            {/* Results Grid/List */}
            <div
              className={
                state.viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {items.map((item) => (
                <CatalogCard
                  key={item.id}
                  item={item}
                  viewMode={state.viewMode}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Main Browse component with FiltersProvider
export default function Browse() {
  return (
    <FiltersProvider>
      <BrowseContent />
    </FiltersProvider>
  );
}
