import { pgTable, text, timestamp, integer, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { courses } from "./courses";

export const learningPaths = pgTable("learning_paths", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  thumbnail: text("thumbnail"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const learningPathCourses = pgTable("learning_path_courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  learningPathId: uuid("learning_path_id")
    .notNull()
    .references(() => learningPaths.id, { onDelete: "cascade" }),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
});

export const learningPathsRelations = relations(learningPaths, ({ many }) => ({
  courses: many(learningPathCourses),
}));

export const learningPathCoursesRelations = relations(learningPathCourses, ({ one }) => ({
  learningPath: one(learningPaths, {
    fields: [learningPathCourses.learningPathId],
    references: [learningPaths.id],
  }),
  course: one(courses, {
    fields: [learningPathCourses.courseId],
    references: [courses.id],
  }),
}));
