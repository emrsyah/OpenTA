/**
 * Utility functions for parsing and normalizing lecturer (dosen) names
 * from the catalog editor field
 */

/**
 * Academic titles commonly found in Indonesian academic settings
 */
const ACADEMIC_TITLES = [
  // Indonesian degrees
  "S.T\\.?",
  "S.Kom\\.?",
  "S.Si\\.?",
  "S.E\\.?",
  "S.Pd\\.?",
  "S.Sos\\.?",
  "S.Hut\\.?",
  "S.P\\.?",
  "S.Agr\\.?",
  "S.T.P",
  // Master's degrees
  "M.Sc\\.?",
  "M.Kom\\.?",
  "M.T\\.?",
  "M.Si\\.?",
  "M.Eng\\.?",
  "M.BA\\.?",
  "M.M\\.?",
  "M.Pd\\.?",
  "M.A\\.?",
  "M.Sos\\.?",
  "MBA",
  // Doctoral degrees
  "Ph.D\\.?",
  "Dr\\.?",
  "Drs\\.?",
  "Dra\\.?",
  // Professional titles
  "Prof\\.?",
  "Ir\\.?",
  "Apt\\.?",
];

const TITLE_REGEX = new RegExp(
  `[,\\s]*(${ACADEMIC_TITLES.join("|")})[.,]?`,
  "gi",
);

/**
 * Parse editor field into individual lecturer names
 * Handles various formats like:
 * - "Hendri Tanjung, Lisa Listiana"
 * - "Isnaini Nursusilawati,S.T.,M.Sc"
 * - "Dr. Hendri Tanjung; Lisa Listiana, M.Kom"
 *
 * @param editor - Raw editor string from catalog
 * @returns Array of cleaned lecturer names
 */
export function parseEditorField(editor: string | null): string[] {
  if (!editor || editor.trim() === "") {
    return [];
  }

  // Split by common delimiters: comma, semicolon, ampersand, "dan"
  const rawNames = editor.split(/[,;]|\band\b|&/i);

  return rawNames
    .map((name) => normalizeLecturerName(name))
    .filter((name) => name !== null) as string[];
}

/**
 * Normalize a single lecturer name by:
 * - Trimming whitespace
 * - Removing academic titles
 * - Standardizing spacing
 * - Title casing
 *
 * @param name - Raw name string
 * @returns Cleaned name or null if invalid
 */
export function normalizeLecturerName(name: string): string | null {
  if (!name || name.trim() === "") {
    return null;
  }

  let cleaned = name
    .trim()
    // Remove academic titles
    .replace(TITLE_REGEX, "")
    // Clean up multiple spaces
    .replace(/\s+/g, " ")
    // Remove leading/trailing punctuation
    .replace(/^[\s,.;-]+|[\s,.;-]+$/g, "")
    .trim();

  // Skip if too short (probably not a real name)
  if (cleaned.length < 3) {
    return null;
  }

  // Title case the name
  cleaned = toTitleCase(cleaned);

  return cleaned;
}

/**
 * Convert string to title case
 * "hendri tanjung" -> "Hendri Tanjung"
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Extract unique lecturers from a list of catalog items
 * Useful for building a lecturer filter dropdown
 *
 * @param items - Array of catalog items with editor field
 * @returns Array of unique lecturer names sorted alphabetically
 */
export function extractUniqueLecturers(
  items: Array<{ editor: string | null }>,
): string[] {
  const lecturers = new Set<string>();

  for (const item of items) {
    if (item.editor) {
      const names = parseEditorField(item.editor);
      names.forEach((name) => lecturers.add(name));
    }
  }

  return Array.from(lecturers).sort((a, b) => a.localeCompare(b));
}

/**
 * Check if a lecturer name matches a search query
 * Supports partial matching
 *
 * @param lecturerName - The lecturer name to check
 * @param query - Search query (case insensitive)
 * @returns True if match
 */
export function matchesLecturerQuery(
  lecturerName: string,
  query: string,
): boolean {
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedName = lecturerName.toLowerCase();

  // Exact match or substring match
  return normalizedName.includes(normalizedQuery);
}

/**
 * Group catalog items by lecturer
 * Items with multiple editors will appear under each editor
 *
 * @param items - Array of catalog items
 * @returns Map of lecturer name to array of their papers
 */
export function groupByLecturer<T extends { editor: string | null }>(
  items: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();

  for (const item of items) {
    if (item.editor) {
      const lecturers = parseEditorField(item.editor);
      for (const lecturer of lecturers) {
        if (!map.has(lecturer)) {
          map.set(lecturer, []);
        }
        map.get(lecturer)!.push(item);
      }
    }
  }

  return map;
}

/**
 * Calculate statistics for a lecturer based on their papers
 *
 * @param papers - Array of papers supervised by the lecturer
 * @returns Statistics object
 */
export function calculateLecturerStats(
  papers: Array<{ publicationYear: number | null; subject: string | null }>,
) {
  if (papers.length === 0) {
    return {
      totalPapers: 0,
      yearRange: { min: null, max: null },
      subjects: [],
    };
  }

  const years = papers
    .map((p) => p.publicationYear)
    .filter((y): y is number => y !== null);

  const subjects = new Set<string>();
  papers.forEach((p) => {
    if (p.subject) {
      // Split subjects by common delimiters and add each
      p.subject
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .forEach((s) => subjects.add(s));
    }
  });

  return {
    totalPapers: papers.length,
    yearRange: {
      min: years.length > 0 ? Math.min(...years) : null,
      max: years.length > 0 ? Math.max(...years) : null,
    },
    subjects: Array.from(subjects).slice(0, 5), // Top 5 subjects
  };
}
