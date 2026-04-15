import { pgTable, text, numeric, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { courses } from "./courses";
import { quizAttempts } from "./quizzes";

export const certificates = pgTable("certificate", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  quizAttemptId: text("quiz_attempt_id")
    .references(() => quizAttempts.id, { onDelete: "set null" }),
  certificateNumber: varchar("certificate_number", { length: 50 }).notNull().unique(),
  score: numeric("score", { precision: 5, scale: 2 }).notNull(),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  pdfUrl: text("pdf_url"),
});

export const certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(users, { fields: [certificates.userId], references: [users.id] }),
  course: one(courses, { fields: [certificates.courseId], references: [courses.id] }),
  quizAttempt: one(quizAttempts, { fields: [certificates.quizAttemptId], references: [quizAttempts.id] }),
}));
