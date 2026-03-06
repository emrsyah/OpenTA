import {
  pgTable,
  index,
  serial,
  text,
  varchar,
  smallint,
  integer,
  vector,
  timestamp,
  unique,
  boolean,
  foreignKey,
  bigint,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const catalogType = pgEnum("catalog_type", [
  "Artikel - Restricted Use",
  "Bahan Ajar",
  "Buku - Circulation (BI Corner)",
  "Buku - Circulation (Dapat Dipinjam)",
  "Buku - Elektronik (E-Book)",
  "Buku - Elektronik (E-Book) Kindle",
  "Buku - Elektronik (E-Book) Restricted",
  "Buku - Elektronik (E-Book) Tel-U Press",
  "Buku - LAC",
  "Buku - Reference (Hanya Baca di Tempat)",
  "Buku Rekreatif - Circulation",
  "Buku Softskill - Circulation",
  "Case Studies",
  "Disertasi - Reference",
  "E-Article",
  "Institutional Content",
  "Jurnal Internasional - Reference",
  "Jurnal Nasional - Reference",
  "Jurnal Terakreditasi DIKTI - Reference",
  "Karya Ilmiah - Disertasi (S3) - Reference",
  "Karya Ilmiah - Skripsi (S1) - Reference",
  "Karya Ilmiah - TA (D3) - Reference",
  "Karya Ilmiah - Thesis (S2) - Reference",
  "Majalah - Reference",
  "Majalah Bundling",
  "Majalah Ilmiah - Reference",
  "Majalah Populer - Reference",
  "Modul Praktikum ( Electronic )",
  "Proceeding ( Electronic )",
  "e - Article Journal",
  "ePoster",
  "skripsi",
]);

export const catalog = pgTable(
  "catalog",
  {
    id: serial().primaryKey().notNull(),
    title: text().notNull(),
    catalogNumber: varchar("catalog_number", { length: 100 }),
    catalogType: catalogType("catalog_type"),
    classificationNumber: varchar("classification_number", { length: 100 }),
    subject: varchar({ length: 255 }),
    author: text(),
    editor: text(),
    publisher: text(),
    shelfNumber: varchar("shelf_number", { length: 100 }),
    libraryLocation: text("library_location"),
    publicationYear: smallint("publication_year"),
    totalCopies: integer("total_copies").default(0),
    accessLink: text("access_link"),
    abstract: text(),
    embedding: vector({ dimensions: 1024 }),
  },
  (table) => [
    index("catalog_embedding_hnsw_idx")
      .using("hnsw", table.embedding.asc().nullsLast().op("vector_cosine_ops"))
      .with({ m: "8", ef_construction: "64" }),
    index("catalog_publication_year_idx").using(
      "btree",
      table.publicationYear.asc().nullsLast().op("int2_ops"),
    ),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text().primaryKey().notNull(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("verification_identifier_idx").using(
      "btree",
      table.identifier.asc().nullsLast().op("text_ops"),
    ),
  ],
);

export const user = pgTable(
  "user",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("user_email_unique").on(table.email)],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey().notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "string",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "string",
    }),
    scope: text(),
    password: text(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    index("account_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "account_user_id_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text().primaryKey().notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    token: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull(),
  },
  (table) => [
    index("session_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "session_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("session_token_unique").on(table.token),
  ],
);

export const rateLimit = pgTable(
  "rate_limit",
  {
    id: text().primaryKey().notNull(),
    key: text().notNull(),
    count: integer().notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    lastRequest: bigint("last_request", { mode: "number" }).notNull(),
  },
  (table) => [unique("rate_limit_key_unique").on(table.key)],
);

export const alembicVersion = pgTable("alembic_version", {
  versionNum: varchar("version_num", { length: 32 }).primaryKey().notNull(),
});

export const conversations = pgTable(
  "conversations",
  {
    id: varchar({ length: 128 }).primaryKey().notNull(),
    title: text(),
    isIncognito: boolean("is_incognito").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("conversations_created_at_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamptz_ops"),
    ),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: serial().primaryKey().notNull(),
    conversationId: varchar("conversation_id", { length: 128 }).notNull(),
    question: text().notNull(),
    answer: text().notNull(),
    sources: jsonb(),
    searchQuery: text("search_query"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("messages_conversation_id_idx").using(
      "btree",
      table.conversationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.conversationId],
      foreignColumns: [conversations.id],
      name: "messages_conversation_id_fkey",
    }).onDelete("cascade"),
  ],
);
