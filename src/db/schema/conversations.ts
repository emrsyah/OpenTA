import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// Conversations table - id is the client-generated nanoid (matches BE schema)
export const conversations = pgTable(
  "conversations",
  {
    id: varchar({ length: 128 }).primaryKey().notNull(),
    title: text(),
    isIncognito: boolean("is_incognito").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("conversations_created_at_idx").using(
      "btree",
      table.createdAt.asc().nullsLast(),
    ),
  ],
);

// Messages table
export const messages = pgTable(
  "messages",
  {
    id: serial().primaryKey().notNull(),
    conversationId: varchar("conversation_id", { length: 128 })
      .references(() => conversations.id, { onDelete: "cascade" })
      .notNull(),
    question: text().notNull(),
    answer: text().notNull(),
    sources: jsonb("sources").$type<
      Array<{
        id: string;
        title: string;
        authors: string[];
        abstract: string;
        year: number;
        citation_number: number;
      }>
    >(),
    searchQuery: text("search_query"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("messages_conversation_id_idx").using(
      "btree",
      table.conversationId.asc().nullsLast(),
    ),
  ],
);

// Relations
export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));
