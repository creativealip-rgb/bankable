import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const sidebarItems = pgTable("sidebar_item", {
  id: text("id").primaryKey(),
  section: text("section").notNull(), // WEBINAR or PREMIUM_VIDEO
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  dateLabel: text("date_label"),
  ctaLabel: text("cta_label"),
  href: text("href"),
  priceLabel: text("price_label"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

