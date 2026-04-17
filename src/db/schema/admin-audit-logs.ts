import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const adminAuditLogs = pgTable("admin_audit_log", {
  id: text("id").primaryKey(),
  actorUserId: text("actor_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const adminAuditLogsRelations = relations(adminAuditLogs, ({ one }) => ({
  actor: one(users, { fields: [adminAuditLogs.actorUserId], references: [users.id] }),
}));

