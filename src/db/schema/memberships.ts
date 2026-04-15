import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const memberships = pgTable("membership", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tier: text("tier").notNull().default("FREE"), // FREE, BASIC, PREMIUM, LIFETIME
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, EXPIRED, CANCELLED
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"), // null for lifetime
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
}));
