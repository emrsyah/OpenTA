import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "@/lib/auth/schema";

export const feedback = pgTable(
  "feedback",
  {
    id: serial().primaryKey().notNull(),
    message: text().notNull(),
    email: varchar({ length: 255 }),
    path: varchar({ length: 512 }).notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("feedback_user_id_idx").using("btree", table.userId),
    index("feedback_created_at_idx").using(
      "btree",
      table.createdAt.asc().nullsLast(),
    ),
  ],
);

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(user, {
    fields: [feedback.userId],
    references: [user.id],
  }),
}));
