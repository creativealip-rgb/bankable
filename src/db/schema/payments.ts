import { pgTable, text, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const payments = pgTable("payment", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // MIDTRANS | XENDIT
  tier: text("tier").notNull(), // FREE | BASIC | PREMIUM | LIFETIME
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("IDR"),
  status: text("status").notNull().default("PENDING"), // PENDING | PAID | FAILED | EXPIRED
  externalId: text("external_id").notNull().unique(),
  checkoutUrl: text("checkout_url"),
  providerPayload: jsonb("provider_payload"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
}));

