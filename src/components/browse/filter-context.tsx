"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

// Catalog types from schema
export const CATALOG_TYPES = [
  "all",
  "Karya Ilmiah - Skripsi (S1) - Reference",
  "Karya Ilmiah - Thesis (S2) - Reference",
  "Karya Ilmiah - Disertasi (S3) - Reference",
  "Buku - Elektronik (E-Book)",
  "Jurnal Internasional - Reference",
  "Jurnal Nasional - Reference",
  "Artikel - Restricted Use",
  "Proceeding ( Electronic )",
] as const;

// Fixed year range from 2020 to 2026
export const YEARS: readonly number[] = Array.from(
  { length: 7 },
  (_, i) => 2020 + i,
);

export const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "year-desc", label: "Year (Newest)" },
  { value: "year-asc", label: "Year (Oldest)" },
  { value: "title-asc", label: "Title (A-Z)" },
  { value: "title-desc", label: "Title (Z-A)" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];
export type ViewMode = "grid" | "list";

// Filter state interface
interface FiltersState {
  search: string;
  catalogType: string;
  yearFrom: string;
  yearTo: string;
  subject: string;
  editor: string;
  sortBy: SortOption;
  viewMode: ViewMode;
}

// Filter actions interface
interface FiltersActions {
  setSearch: (value: string) => void;
  setCatalogType: (value: string) => void;
  setYearFrom: (value: string) => void;
  setYearTo: (value: string) => void;
  setSubject: (value: string) => void;
  setEditor: (value: string) => void;
  setSortBy: (value: SortOption) => void;
  setViewMode: (value: ViewMode) => void;
  clearFilters: () => void;
}

// Filter meta interface for derived state
interface FiltersMeta {
  hasActiveFilters: boolean;
}

// Complete context interface
interface FiltersContextValue {
  state: FiltersState;
  actions: FiltersActions;
  meta: FiltersMeta;
}

const FiltersContext = createContext<FiltersContextValue | undefined>(
  undefined,
);

// Provider props
interface FiltersProviderProps {
  children: ReactNode;
  initialState?: Partial<FiltersState>;
}

// Provider component
export function FiltersProvider({
  children,
  initialState,
}: FiltersProviderProps) {
  const [search, setSearch] = useState(initialState?.search ?? "");
  const [catalogType, setCatalogType] = useState(
    initialState?.catalogType ?? "all",
  );
  const [yearFrom, setYearFrom] = useState(initialState?.yearFrom ?? "any");
  const [yearTo, setYearTo] = useState(initialState?.yearTo ?? "any");
  const [subject, setSubject] = useState(initialState?.subject ?? "all");
  const [editor, setEditor] = useState(initialState?.editor ?? "all");
  const [sortBy, setSortBy] = useState<SortOption>(
    initialState?.sortBy ?? "relevance",
  );
  const [viewMode, setViewMode] = useState<ViewMode>(
    initialState?.viewMode ?? "grid",
  );

  const clearFilters = () => {
    setSearch("");
    setCatalogType("all");
    setYearFrom("any");
    setYearTo("any");
    setSubject("all");
    setEditor("all");
  };

  const state: FiltersState = {
    search,
    catalogType,
    yearFrom,
    yearTo,
    subject,
    editor,
    sortBy,
    viewMode,
  };

  const actions: FiltersActions = {
    setSearch,
    setCatalogType,
    setYearFrom,
    setYearTo,
    setSubject,
    setEditor,
    setSortBy,
    setViewMode,
    clearFilters,
  };

  const meta: FiltersMeta = {
    hasActiveFilters:
      catalogType !== "all" ||
      yearFrom !== "any" ||
      yearTo !== "any" ||
      subject !== "all" ||
      editor !== "all" ||
      search !== "",
  };

  return (
    <FiltersContext.Provider value={{ state, actions, meta }}>
      {children}
    </FiltersContext.Provider>
  );
}

// Hook to use filters context
export function useFilters(): FiltersContextValue {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error("useFilters must be used within a FiltersProvider");
  }
  return context;
}
