import type { Source } from "./use-streaming-chat";

// ─── Citation Processing Utilities ───────────────────────────────────────────

const CITATION_RE = /\[(\d+(?:,\s*\d+)*)\]/g;

export interface CitationMatch {
  type: "citation";
  nums: number[];
  sources: Source[];
  key: number;
}

/**
 * Process text to find citation references [1, 2, 3]
 * Returns an array of strings and citation match objects
 */
export function processTextForCitations(
  text: string,
  sourceMap: Map<number, Source>,
): Array<string | CitationMatch> {
  const parts: Array<string | CitationMatch> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  CITATION_RE.lastIndex = 0;

  while ((match = CITATION_RE.exec(text)) !== null) {
    // Add text before the citation
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Parse citation numbers and find matching sources
    const nums = match[1].split(",").map((n) => parseInt(n.trim(), 10));
    const matched = nums
      .map((n) => sourceMap.get(n))
      .filter((s): s is Source => !!s);

    // Add citation match if sources found, otherwise keep original text
    if (matched.length > 0) {
      parts.push({
        type: "citation",
        nums,
        sources: matched,
        key: match.index,
      });
    } else {
      parts.push(match[0]);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * Group sources by citation number for display
 * Returns an array of source groups sorted by citation number
 */
export function groupAndSortSources(sources: Source[]) {
  const grouped = sources.reduce<Record<number, Source[]>>((acc, s) => {
    if (!acc[s.citation_number]) {
      acc[s.citation_number] = [];
    }
    acc[s.citation_number].push(s);
    return acc;
  }, {});

  return Object.values(grouped).sort(
    (a, b) => a[0].citation_number - b[0].citation_number,
  );
}
