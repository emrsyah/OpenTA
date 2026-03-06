// ───────────────────────────────────────────────────────────────────────────────
// Chat Filter Types for Metadata Filtering in RAG Chat
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Available catalog types for filtering papers
 * User-friendly names map to API values automatically
 */
export const CATALOG_TYPE_OPTIONS = [
  {
    value: "Karya Ilmiah - Thesis (S2) - Reference",
    label: "Thesis / S2 / Master",
  },
  {
    value: "Karya Ilmiah - Skripsi (S1) - Reference",
    label: "Skripsi / S1 / Bachelor",
  },
  {
    value: "Karya Ilmiah - Disertasi (S3) - Reference",
    label: "Disertasi / S3 / PhD",
  },
  { value: "Jurnal Internasional - Reference", label: "Jurnal Internasional" },
  { value: "Jurnal Nasional - Reference", label: "Jurnal Nasional" },
  {
    value: "Jurnal Terakreditasi DIKTI - Reference",
    label: "Jurnal Terakreditasi",
  },
  { value: "Buku - Elektronik (E-Book)", label: "E-Book / Ebook" },
  { value: "Proceeding (Electronic)", label: "Proceeding / Konferensi" },
  { value: "Artikel - Restricted Use", label: "Artikel" },
  { value: "E-Article", label: "E-Article" },
  { value: "Case Studies", label: "Case Study" },
  { value: "Modul Praktikum ( Electronic )", label: "Modul Praktikum" },
  { value: "ePoster", label: "ePoster" },
] as const;

/**
 * Catalog type value type
 */
export type CatalogType = (typeof CATALOG_TYPE_OPTIONS)[number]["value"];

/**
 * Year range preset options
 */
export const YEAR_PRESETS = [
  {
    label: "Last 5 Years",
    from: new Date().getFullYear() - 5,
    to: new Date().getFullYear(),
  },
  {
    label: "Last 10 Years",
    from: new Date().getFullYear() - 10,
    to: new Date().getFullYear(),
  },
  { label: "2020-2024", from: 2020, to: 2024 },
  { label: "2015-2019", from: 2015, to: 2019 },
] as const;

/**
 * Chat metadata parameters including filter options
 * Passed to the backend via meta_params
 */
export interface ChatMetaParams {
  // Existing params
  mode?: "basic" | "deep";
  stream?: boolean;
  language?: string;
  timezone?: string;
  source_preference?: "all" | "only_papers" | "only_general";
  conversation_id?: string;
  is_incognito?: boolean;

  // NEW: Filter params
  catalog_type?: string; // Filter by document type
  year_from?: number; // Minimum publication year
  year_to?: number; // Maximum publication year
  author?: string; // Filter by author name
  has_electronic_access?: boolean; // Only papers with online access
}

/**
 * Active filter state managed by the frontend
 */
export interface ChatFilters {
  catalogType?: CatalogType;
  yearFrom?: number;
  yearTo?: number;
  author?: string;
  hasElectronicAccess?: boolean;
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: ChatFilters): boolean {
  return !!(
    filters.catalogType ||
    filters.yearFrom ||
    filters.yearTo ||
    filters.author ||
    filters.hasElectronicAccess
  );
}

/**
 * Convert frontend filter state to backend meta_params format
 */
export function filtersToMetaParams(
  filters: ChatFilters,
): Partial<ChatMetaParams> {
  return {
    ...(filters.catalogType && { catalog_type: filters.catalogType }),
    ...(filters.yearFrom && { year_from: filters.yearFrom }),
    ...(filters.yearTo && { year_to: filters.yearTo }),
    ...(filters.author && { author: filters.author }),
    ...(filters.hasElectronicAccess !== undefined && {
      has_electronic_access: filters.hasElectronicAccess,
    }),
  };
}

/**
 * Get display label for a catalog type
 */
export function getCatalogTypeLabel(value: string): string {
  const option = CATALOG_TYPE_OPTIONS.find((opt) => opt.value === value);
  return option?.label || value;
}

/**
 * Validate year range (from should be <= to)
 */
export function validateYearRange(from?: number, to?: number): boolean {
  if (from === undefined || to === undefined) return true;
  return from <= to;
}
