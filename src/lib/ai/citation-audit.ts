/**
 * Citation hallucination audit.
 *
 * Pure regex + set intersection logic — no LLM calls, zero latency overhead.
 * Ported from backend/app/utils/streaming.py → _audit_citations()
 */

import type { CitedPaper } from "./types";

export interface CitationAuditResult {
  isClean: boolean;
  hallucinatedCitationNumbers: number[];
  totalCitationsInAnswer: number;
  totalPapersAvailable: number;
}

/**
 * Scan answer text for [N] references and flag any N that exceeds
 * the number of actually retrieved papers.
 */
export function auditCitations(
  answer: string,
  citedPapers: CitedPaper[],
): CitationAuditResult {
  const citedNums = new Set<number>();
  const matches = answer.matchAll(/\[(\d+)\]/g);
  for (const match of matches) {
    citedNums.add(Number.parseInt(match[1], 10));
  }

  const validNums = new Set(citedPapers.map((p) => p.citation_number));
  const hallucinated = [...citedNums]
    .filter((n) => !validNums.has(n))
    .sort((a, b) => a - b);

  return {
    isClean: hallucinated.length === 0,
    hallucinatedCitationNumbers: hallucinated,
    totalCitationsInAnswer: citedNums.size,
    totalPapersAvailable: citedPapers.length,
  };
}
