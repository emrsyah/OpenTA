import Exa from "exa-js";
import { NextResponse } from "next/server";

const exa = new Exa(process.env.EXA_API_KEY);

// Indonesian academic domains to prioritize
const ACADEMIC_DOMAINS = [
  "sinta.kemdikbud.go.id",
  "scholar.google.com",
  "researchgate.net",
  "telkomuniversity.ac.id",
  "tel-u.ac.id",
  "digilib.telkomuniversity.ac.id",
  "academia.edu",
  "orcid.org",
  "scopus.com",
];

interface SearchResult {
  title: string;
  url: string;
  text?: string;
  publishedDate?: string;
  author?: string;
  score?: number;
}

interface CategorizedResults {
  academic: SearchResult[];
  publications: SearchResult[];
  other: SearchResult[];
}

function categorizeResults(results: SearchResult[]): CategorizedResults {
  const categorized: CategorizedResults = {
    academic: [],
    publications: [],
    other: [],
  };

  for (const result of results) {
    const url = result.url.toLowerCase();
    const title = result.title.toLowerCase();

    // Academic profiles
    if (
      url.includes("sinta.kemdikbud") ||
      url.includes("scholar.google") ||
      url.includes("orcid.org") ||
      url.includes("telkomuniversity") ||
      url.includes("tel-u.ac.id") ||
      url.includes("academia.edu")
    ) {
      categorized.academic.push(result);
    }
    // Publications
    else if (
      url.includes("researchgate") ||
      url.includes("arxiv.org") ||
      url.includes("doi.org") ||
      url.includes("springer") ||
      url.includes("ieee.org") ||
      url.includes("acm.org") ||
      title.includes("paper") ||
      title.includes("publikasi") ||
      title.includes("journal")
    ) {
      categorized.publications.push(result);
    }
    // Other relevant results
    else {
      categorized.other.push(result);
    }
  }

  return categorized;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { error: "Lecturer name is required" },
        { status: 400 },
      );
    }

    if (!process.env.EXA_API_KEY) {
      return NextResponse.json(
        { error: "Exa API key not configured" },
        { status: 500 },
      );
    }

    // Build search query with Telkom University context
    const query = `${name} Telkom University dosen`;

    // Search for academic profiles and publications
    const [academicSearch, publicationSearch] = await Promise.all([
      // Academic profile search
      exa.search(query, {
        numResults: 5,
        includeDomains: ACADEMIC_DOMAINS,
        useAutoprompt: true,
      }),
      // Publication search (broader)
      exa.search(`${name} Telkom University research publication`, {
        numResults: 5,
        type: "auto",
        useAutoprompt: true,
      }),
    ]);

    // Combine and deduplicate results
    const allResults: SearchResult[] = [
      ...academicSearch.results.map((r) => ({
        title: r.title || "Untitled",
        url: r.url,
        text: r.text?.slice(0, 200),
        publishedDate: r.publishedDate,
        author: r.author,
        score: r.score,
      })),
      ...publicationSearch.results.map((r) => ({
        title: r.title || "Untitled",
        url: r.url,
        text: r.text?.slice(0, 200),
        publishedDate: r.publishedDate,
        author: r.author,
        score: r.score,
      })),
    ];

    // Remove duplicates by URL
    const uniqueResults = allResults.filter(
      (result, index, self) =>
        index === self.findIndex((r) => r.url === result.url),
    );

    // Categorize results
    const categorized = categorizeResults(uniqueResults);

    return NextResponse.json({
      query: name,
      results: categorized,
      total: uniqueResults.length,
    });
  } catch (error) {
    console.error("Web search API error:", error);
    return NextResponse.json(
      { error: "Failed to search lecturer information" },
      { status: 500 },
    );
  }
}
