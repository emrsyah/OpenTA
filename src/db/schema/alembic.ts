import { pgTable, varchar } from "drizzle-orm/pg-core";

export const alembicVersion = pgTable("alembic_version", {
    versionNum: varchar("version_num", { length: 32 }).primaryKey().notNull(),
});