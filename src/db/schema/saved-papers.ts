import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "@/lib/auth/schema";
import { catalog } from "./catalog";

// Collections table - user-created folders
export const collections = pgTable(
  "collections",
  {
    id: serial().primaryKey().notNull(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar({ length: 100 }).notNull(),
    description: text(),
    color: varchar({ length: 7 }), // Hex color like "#3B82F6"
    icon: varchar({ length: 50 }), // Icon name like "folder", "star"
    isDefault: boolean("is_default").default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("collections_user_id_idx").using("btree", table.userId)],
);

// Saved papers - junction table (many-to-many)
export const savedPapers = pgTable(
  "saved_papers",
  {
    id: serial().primaryKey().notNull(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    catalogId: integer("catalog_id")
      .references(() => catalog.id, { onDelete: "cascade" })
      .notNull(),
    collectionId: integer("collection_id").references(() => collections.id, {
      onDelete: "cascade",
    }),
    note: text(), // Single note per saved paper
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Index for user queries
    index("saved_papers_user_id_idx").using("btree", table.userId),
    // Index for collection queries
    index("saved_papers_collection_id_idx").using("btree", table.collectionId),
    // Index for catalog lookups
    index("saved_papers_catalog_id_idx").using("btree", table.catalogId),
    // Unique: one user can save same paper to same collection once
    uniqueIndex("saved_papers_user_catalog_collection_idx").on(
      table.userId,
      table.catalogId,
      table.collectionId,
    ),
  ],
);

// Relations
export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(user, {
    fields: [collections.userId],
    references: [user.id],
  }),
  savedPapers: many(savedPapers),
}));

export const savedPapersRelations = relations(savedPapers, ({ one }) => ({
  user: one(user, {
    fields: [savedPapers.userId],
    references: [user.id],
  }),
  catalog: one(catalog, {
    fields: [savedPapers.catalogId],
    references: [catalog.id],
  }),
  collection: one(collections, {
    fields: [savedPapers.collectionId],
    references: [collections.id],
  }),
}));

// Type exports
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type SavedPaper = typeof savedPapers.$inferSelect;
export type NewSavedPaper = typeof savedPapers.$inferInsert;
