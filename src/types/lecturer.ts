export interface Paper {
    id: number;
    title: string;
    author: string | null;
    editor: string | null;
    publicationYear: number | null;
    abstract: string | null;
    subject: string | null;
    catalogNumber: string | null;
    classificationNumber: string | null;
    publisher: string | null;
    accessLink: string | null;
    similarity?: number;
}

export interface LecturerResult {
    name: string;
    paperCount: number;
    relevanceScore: number;
    searchMethod: "vector" | "fulltext";
    stats: {
        totalPapers: number;
        yearRange: { min: number | null; max: number | null };
        subjects: string[];
    };
    topPapers: Array<{
        id: number;
        title: string;
        author: string | null;
        publicationYear: number | null;
        abstract: string | null;
        subject: string | null;
    }>;
}

export interface LecturerDetail {
    name: string;
    stats: {
        totalPapers: number;
        yearRange: { min: number | null; max: number | null };
        subjects: string[];
        coLecturers: string[];
    };
    papers: Paper[];
}

export interface SearchResponse {
    lecturers: LecturerResult[];
    total: number;
    query: {
        topic: string;
        lecturerName: string;
    };
    searchMethod: "vector" | "fulltext";
}

export interface DetailResponse {
    lecturer: LecturerDetail;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface WebSearchResult {
    title: string;
    url: string;
    text?: string;
    publishedDate?: string;
    score?: number;
}

export interface WebSearchResults {
    academic: WebSearchResult[];
    publications: WebSearchResult[];
    other: WebSearchResult[];
}

export interface WebSearchResponse {
    query: string;
    results: WebSearchResults;
    total: number;
}
