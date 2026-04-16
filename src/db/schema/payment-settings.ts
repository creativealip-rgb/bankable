import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const paymentSettings = pgTable("payment_settings", {
  id: text("id").primaryKey().default("global"),
  paymentMode: text("payment_mode").notNull().default("GATEWAY"), // MANUAL | GATEWAY
  paymentProvider: text("payment_provider").notNull().default("MIDTRANS"), // MIDTRANS | XENDIT
  manualInstructions: text("manual_instructions"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

