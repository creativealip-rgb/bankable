import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { courses } from "./courses";

export const discussionThreads = pgTable("discussion_thread", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const discussionPosts = pgTable("discussion_post", {
  id: text("id").primaryKey(),
  threadId: text("thread_id")
    .notNull()
    .references(() => discussionThreads.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const courseReviews = pgTable("course_review", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5
  review: text("review"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const discussionThreadsRelations = relations(discussionThreads, ({ one, many }) => ({
  course: one(courses, { fields: [discussionThreads.courseId], references: [courses.id] }),
  createdBy: one(users, { fields: [discussionThreads.createdById], references: [users.id] }),
  posts: many(discussionPosts),
}));

export const discussionPostsRelations = relations(discussionPosts, ({ one }) => ({
  thread: one(discussionThreads, { fields: [discussionPosts.threadId], references: [discussionThreads.id] }),
  user: one(users, { fields: [discussionPosts.userId], references: [users.id] }),
}));

export const courseReviewsRelations = relations(courseReviews, ({ one }) => ({
  course: one(courses, { fields: [courseReviews.courseId], references: [courses.id] }),
  user: one(users, { fields: [courseReviews.userId], references: [users.id] }),
}));

