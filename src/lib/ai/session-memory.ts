/**
 * Session Memory Manager — Redis + PostgreSQL for conversation history.
 *
 * Ported from backend/app/services/session_manager.py → SessionManager.
 * Redis provides fast access for active sessions; PostgreSQL is the
 * long-term store. Falls back to DB-only when Redis is unavailable.
 *
 * Redis key structure mirrors the Python implementation:
 *   conversation:{id}        → JSON array of message turns
 *   conversation:meta:{id}   → JSON object with metadata
 */

import Redis from "ioredis";
import { env } from "@/lib/env";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema/conversations";
import type { CitedPaper, ConversationTurn } from "./types";

export interface SessionMemoryOptions {
  redisUrl?: string;
  defaultTtl?: number; // seconds
  maxMessagesPerSession?: number;
}

const DEFAULT_OPTIONS: Required<SessionMemoryOptions> = {
  redisUrl: "redis://localhost:6379",
  defaultTtl: 3600, // 1 hour
  maxMessagesPerSession: 50,
};

export class SessionMemory {
  private redis: Redis | null = null;
  private redisAvailable = false;
  private readonly options: Required<SessionMemoryOptions>;

  constructor(opts?: SessionMemoryOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...opts };
  }

  // ── Redis connection management ─────────────────────────────────────

  private async connect(): Promise<boolean> {
    if (this.redis !== null) return this.redisAvailable;

    try {
      this.redis = new Redis(this.options.redisUrl, {
        lazyConnect: true,
        connectTimeout: 10000,
        maxRetriesPerRequest: 1,
      });
      await this.redis.connect();
      await this.redis.ping();
      this.redisAvailable = true;
      console.log("[SESSION] Connected to Redis");
      return true;
    } catch (error) {
      console.warn("[SESSION] Redis unavailable, running in DB-only mode:", error);
      this.redis = null;
      this.redisAvailable = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch {
        // Ignore close errors
      }
      this.redis = null;
      this.redisAvailable = false;
    }
  }

  // ── Key helpers ────────────────────────────────────────────────────

  private sessionKey(conversationId: string): string {
    return `conversation:${conversationId}`;
  }

  private metaKey(conversationId: string): string {
    return `conversation:meta:${conversationId}`;
  }

  // ── Session lifecycle ──────────────────────────────────────────────

  async createSession(
    conversationId: string,
    userId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const ok = await this.connect();

    if (ok) {
      try {
        const meta = {
          conversation_id: conversationId,
          user_id: userId,
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          message_count: 0,
          ...metadata,
        };
        await this.redis!.setex(
          this.metaKey(conversationId),
          this.options.defaultTtl,
          JSON.stringify(meta),
        );
        await this.redis!.setex(
          this.sessionKey(conversationId),
          this.options.defaultTtl,
          JSON.stringify([]),
        );
      } catch (error) {
        console.warn("[SESSION] Redis create failed:", error);
        this.redis = null;
        this.redisAvailable = false;
      }
    }
  }

  // ── History management ─────────────────────────────────────────────

  async getHistory(
    conversationId: string,
    opts?: { limit?: number; userId?: string },
  ): Promise<ConversationTurn[]> {
    const limit = opts?.limit || this.options.maxMessagesPerSession;
    const ok = await this.connect();

    if (!ok) {
      return this.loadFromDatabase(conversationId, limit, opts?.userId);
    }

    try {
      const data = await this.redis!.get(this.sessionKey(conversationId));

      if (!data) {
        // Redis miss — load from DB and cache
        const dbMessages = await this.loadFromDatabase(conversationId, limit, opts?.userId);
        if (dbMessages.length > 0) {
          await this.redis!.setex(
            this.sessionKey(conversationId),
            this.options.defaultTtl,
            JSON.stringify(dbMessages),
          );
        }
        return dbMessages;
      }

      const turns: ConversationTurn[] = JSON.parse(data);
      return turns.length > limit ? turns.slice(-limit) : turns;
    } catch (error) {
      console.warn("[SESSION] Redis get failed, falling back to DB:", error);
      this.redis = null;
      this.redisAvailable = false;
      return this.loadFromDatabase(conversationId, limit, opts?.userId);
    }
  }

  async addMessage(
    conversationId: string,
    turn: ConversationTurn,
    opts?: { userId?: string },
  ): Promise<void> {
    const ok = await this.connect();

    if (ok) {
      try {
        const data = await this.redis!.get(this.sessionKey(conversationId));
        const turns: ConversationTurn[] = data ? JSON.parse(data) : [];
        turns.push(turn);

        if (turns.length > this.options.maxMessagesPerSession) {
          turns.splice(0, turns.length - this.options.maxMessagesPerSession);
        }

        await this.redis!.setex(
          this.sessionKey(conversationId),
          this.options.defaultTtl,
          JSON.stringify(turns),
        );
      } catch (error) {
        console.warn("[SESSION] Redis write failed:", error);
        this.redis = null;
        this.redisAvailable = false;
      }
    }

    // Always persist to DB
    await this.saveToDatabase(conversationId, turn, opts?.userId);
  }

  async deleteSession(conversationId: string): Promise<void> {
    await this.connect();
    if (this.redis) {
      try {
        await this.redis.del(this.sessionKey(conversationId), this.metaKey(conversationId));
      } catch {
        // Ignore
      }
    }
  }

  // ── Database persistence ───────────────────────────────────────────

  private async saveToDatabase(
    conversationId: string,
    turn: ConversationTurn,
    userId?: string,
  ): Promise<void> {
    try {
      // Ensure conversation row exists
      const existing = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);

      if (existing.length === 0 && userId) {
        await db.insert(conversations).values({
          id: conversationId,
          userId,
          isIncognito: false,
        });
      }

      // Insert message
      const question = turn.question || turn.content || "";
      const answer = turn.answer || turn.content || "";

      if (question || answer) {
        await db.insert(messages).values({
          conversationId,
          question,
          answer,
          sources: turn.sources || undefined,
          searchQuery: turn.searchQuery || undefined,
        });
      }
    } catch (error) {
      console.warn("[SESSION] DB save failed:", error);
    }
  }

  private async loadFromDatabase(
    conversationId: string,
    limit: number,
    userId?: string,
  ): Promise<ConversationTurn[]> {
    try {
      // Verify conversation exists
      const conv = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);

      if (conv.length === 0) return [];

      const dbMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .limit(limit);

      return dbMessages.map((m) => ({
        role: "assistant" as const,
        question: m.question,
        answer: m.answer,
        sources: (m.sources as CitedPaper[]) || undefined,
        searchQuery: m.searchQuery || undefined,
        timestamp: m.createdAt?.toISOString(),
      }));
    } catch (error) {
      console.warn("[SESSION] DB load failed:", error);
      return [];
    }
  }

  // ── Session papers tracking ────────────────────────────────────────

  async getSessionPapers(conversationId: string): Promise<CitedPaper[]> {
    const ok = await this.connect();

    if (!ok) {
      // Extract from DB messages
      const turns = await this.loadFromDatabase(conversationId, this.options.maxMessagesPerSession);
      return this.extractPapersFromTurns(turns);
    }

    try {
      const key = `session_papers:${conversationId}`;
      const data = await this.redis!.get(key);

      if (data) {
        return JSON.parse(data);
      }

      // Fallback: extract from message history
      const turns = await this.loadFromDatabase(conversationId, this.options.maxMessagesPerSession);
      const papers = this.extractPapersFromTurns(turns);
      if (papers.length > 0) {
        await this.redis!.setex(key, this.options.defaultTtl, JSON.stringify(papers));
      }
      return papers;
    } catch (error) {
      console.warn("[SESSION] Failed to get session papers:", error);
      return [];
    }
  }

  async addSessionPapers(conversationId: string, papers: CitedPaper[]): Promise<void> {
    if (papers.length === 0) return;

    const ok = await this.connect();
    if (!ok) return;

    try {
      const key = `session_papers:${conversationId}`;
      const existingData = await this.redis!.get(key);
      const existing: CitedPaper[] = existingData ? JSON.parse(existingData) : [];

      const existingIds = new Set(existing.map((p) => p.id));
      for (const paper of papers) {
        if (!existingIds.has(paper.id)) {
          existing.push(paper);
          existingIds.add(paper.id);
        }
      }

      // Re-number citations sequentially
      for (let i = 0; i < existing.length; i++) {
        existing[i].citation_number = i + 1;
      }

      await this.redis!.setex(key, this.options.defaultTtl, JSON.stringify(existing));
    } catch (error) {
      console.warn("[SESSION] Failed to add session papers:", error);
    }
  }

  private extractPapersFromTurns(turns: ConversationTurn[]): CitedPaper[] {
    const allPapers: CitedPaper[] = [];
    const seenIds = new Set<string>();

    for (const turn of turns) {
      const sources = turn.sources || [];
      for (const paper of sources) {
        if (paper && paper.id && !seenIds.has(paper.id)) {
          allPapers.push(paper);
          seenIds.add(paper.id);
        }
      }
    }

    for (let i = 0; i < allPapers.length; i++) {
      allPapers[i].citation_number = i + 1;
    }

    return allPapers;
  }
}

// ── Singleton ────────────────────────────────────────────────────────

let _sessionMemory: SessionMemory | null = null;

export function getSessionMemory(opts?: SessionMemoryOptions): SessionMemory {
  if (!_sessionMemory) {
    _sessionMemory = new SessionMemory({
      // Always honour the REDIS_URL env var; callers may still override via opts.
      redisUrl: env.REDIS_URL,
      ...opts,
    });
  }
  return _sessionMemory;
}
