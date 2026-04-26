import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const systemSettings = pgTable("system_setting", {
  key: text("key").primaryKey(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
