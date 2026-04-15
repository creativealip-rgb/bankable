import { pgTable, text, integer, timestamp, boolean, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { quizzes } from "./quizzes";
import { certificates } from "./certificates";

export const courses = pgTable("course", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  type: text("type").notNull().default("MULTI"), // SINGLE or MULTI
  category: text("category").notNull(),
  level: text("level").notNull().default("BEGINNER"), // BEGINNER, INTERMEDIATE, ADVANCED
  thumbnail: text("thumbnail"),
  price: numeric("price", { precision: 12, scale: 2 }),
  status: text("status").notNull().default("DRAFT"), // DRAFT, PUBLISHED, ARCHIVED
  minWatchPct: integer("min_watch_pct").notNull().default(90),
  createdById: text("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const coursesRelations = relations(courses, ({ one, many }) => ({
  createdBy: one(users, { fields: [courses.createdById], references: [users.id] }),
  modules: many(modules),
  quiz: many(quizzes),
  certificates: many(certificates),
}));

export const modules = pgTable("module", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, { fields: [modules.courseId], references: [courses.id] }),
  videos: many(videos),
}));

export const videos = pgTable("video", {
  id: text("id").primaryKey(),
  moduleId: text("module_id")
    .notNull()
    .references(() => modules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url"), // YouTube/Vimeo embed URL or uploaded file URL
  duration: integer("duration").notNull().default(0), // in seconds
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const videosRelations = relations(videos, ({ one }) => ({
  module: one(modules, { fields: [videos.moduleId], references: [modules.id] }),
}));
