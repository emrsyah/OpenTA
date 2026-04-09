/**
 * Shared types for the AI agent layer.
 * These types mirror the SSE event contract consumed by use-streaming-chat.ts.
 */

// ── Paper result from the retriever ──────────────────────────────────

export interface PaperResult {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  keywords: string[];
  relevanceScore: number;
}

// ── Source as stored in DB messages.sources ──────────────────────────

export interface CitedPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  citation_number: number;
}

// ── Search options ───────────────────────────────────────────────────

export interface SearchOptions {
  limit?: number;
  catalogType?: string;
  yearFrom?: number;
  yearTo?: number;
}

// ── Conversation history turn (from DB or Redis) ─────────────────────

export interface ConversationTurn {
  role: "user" | "assistant";
  question?: string;
  answer?: string;
  content?: string;
  sources?: CitedPaper[];
  searchQuery?: string;
  timestamp?: string;
}

// ── Stream chat options (input to the agent) ─────────────────────────

export interface StreamChatOptions {
  question: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  conversationId?: string;
  userId?: string;
  language?: string;
  catalogType?: string;
  yearFrom?: number;
  yearTo?: number;
  author?: string;
  isIncognito?: boolean;
  isFirstMessage?: boolean;
}

// ── Chat filters (from frontend) ─────────────────────────────────────

export interface ChatFilters {
  catalogType?: string;
  yearFrom?: number;
  yearTo?: number;
  author?: string;
  hasElectronicAccess?: boolean;
}
