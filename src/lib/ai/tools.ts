/**
 * Agent tools for the ResearchAgent.
 *
 * Three tools, matching the Python backend:
 *   1. create_plan(steps)       — plan-first for complex queries
 *   2. search_papers(...)       — semantic vector search in Telkom catalog
 *   3. get_paper_details(ids)   — batch full-metadata fetch for follow-up/compare
 *
 * Built with Vercel AI SDK `tool()` for use with `streamText()`.
 */

import { tool } from "ai";
import { z } from "zod";
import { searchPapers, getPapersByIds } from "./retriever";

// ── Tool 1: create_plan ──────────────────────────────────────────────

export const createPlanTool = tool({
  description: `\
Plan the research task before executing it.

Call this tool FIRST for any complex query that requires multiple
searches, comparisons, or a structured literature review.
Do NOT call it for simple single-topic lookups or casual questions.`,
  inputSchema: z.object({
    steps: z
      .array(z.string())
      .describe(
        "Ordered list of concise step labels, e.g. ['Search CNN papers', 'Compare and synthesize']",
      ),
  }),
  execute: async ({ steps }) => {
    return JSON.stringify({
      status: "plan_created",
      steps,
    });
  },
});

// ── Tool 2: search_papers ────────────────────────────────────────────

export const searchPapersTool = tool({
  description: `\
Search for research papers in the Telkom University academic catalog.

Use this whenever the user asks about research papers, academic topics,
theses, or scholarly work. You may call it multiple times with
different queries to gather comprehensive results.

IMPORTANT: The query argument must ALWAYS be in English and must be a
concise semantic summary of what the user is looking for — never pass
the raw user message.`,
  inputSchema: z.object({
    query: z.string().describe("Concise English keywords for semantic search"),
    limit: z.number().min(1).max(10).optional().default(5).describe("Maximum papers to return (1-10)"),
    catalog_type: z.string().optional().describe("Optional catalog type filter"),
    year_from: z.number().optional().describe("Minimum publication year"),
    year_to: z.number().optional().describe("Maximum publication year"),
  }),
  execute: async ({ query, limit = 5, catalog_type, year_from, year_to }) => {
    try {
      const papers = await searchPapers(query, {
        limit,
        catalogType: catalog_type || undefined,
        yearFrom: year_from && year_from > 0 ? year_from : undefined,
        yearTo: year_to && year_to > 0 ? year_to : undefined,
      });

      if (papers.length === 0) {
        return JSON.stringify({
          status: "no_results",
          message: "No papers found. Try broader keywords or remove filters.",
        });
      }

      const results = papers.map((p, i) => ({
        paper_number: i + 1,
        id: p.id,
        title: p.title,
        authors: p.authors,
        year: p.year,
        abstract: p.abstract.length > 500 ? `${p.abstract.slice(0, 500)}…` : p.abstract,
        keywords: p.keywords,
        relevance_score: Number(p.relevanceScore.toFixed(4)),
      }));

      return JSON.stringify({
        status: "success",
        count: results.length,
        papers: results,
      });
    } catch (error) {
      console.error("[AGENT] search_papers error:", error);
      return JSON.stringify({
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  },
});

// ── Tool 3: get_paper_details ─────────────────────────────────────────

export const getPaperDetailsTool = tool({
  description: `\
Fetch full metadata for one or more papers by their integer IDs.

Use this tool to retrieve complete details (full abstract, catalog type,
publisher, access link, subject) when you need to do a thorough
comparison or answer a detailed follow-up question about specific papers.
Pass ALL relevant IDs in a single call.`,
  inputSchema: z.object({
    paper_ids: z.array(z.number()).describe("List of integer paper IDs from previous search results"),
  }),
  execute: async ({ paper_ids }) => {
    try {
      const records = await getPapersByIds(paper_ids);

      if (records.length === 0) {
        return JSON.stringify({
          status: "not_found",
          message: "No papers found for the given IDs.",
        });
      }

      return JSON.stringify({
        status: "success",
        count: records.length,
        papers: records,
      });
    } catch (error) {
      console.error("[AGENT] get_paper_details error:", error);
      return JSON.stringify({
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  },
});

// ── Tool map for streamText ───────────────────────────────────────────

export const researchTools = {
  create_plan: createPlanTool,
  search_papers: searchPapersTool,
  get_paper_details: getPaperDetailsTool,
};
