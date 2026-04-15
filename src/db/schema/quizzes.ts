import { pgTable, text, integer, boolean, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { courses } from "./courses";

export const quizzes = pgTable("quiz", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .unique()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  passingGrade: integer("passing_grade").notNull().default(70),
  timeLimit: integer("time_limit").notNull().default(30), // in minutes
  maxAttempts: integer("max_attempts").notNull().default(3),
  shuffleQuestions: boolean("shuffle_questions").notNull().default(false),
  shuffleOptions: boolean("shuffle_options").notNull().default(false),
  showAnswers: boolean("show_answers").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  course: one(courses, { fields: [quizzes.courseId], references: [courses.id] }),
  questions: many(questions),
  attempts: many(quizAttempts),
}));

export const questions = pgTable("question", {
  id: text("id").primaryKey(),
  quizId: text("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("MULTIPLE_CHOICE"), // MULTIPLE_CHOICE, MULTI_SELECT, TRUE_FALSE, SHORT_ANSWER
  questionText: text("question_text").notNull(),
  options: jsonb("options").$type<{ text: string; isCorrect: boolean }[]>(),
  correctAnswer: text("correct_answer"), // for SHORT_ANSWER type
  points: integer("points").notNull().default(1),
  order: integer("order").notNull().default(0),
});

export const questionsRelations = relations(questions, ({ one }) => ({
  quiz: one(quizzes, { fields: [questions.quizId], references: [quizzes.id] }),
}));

export const quizAttempts = pgTable("quiz_attempt", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  quizId: text("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  score: numeric("score", { precision: 5, scale: 2 }).notNull().default("0"),
  passed: boolean("passed").notNull().default(false),
  answers: jsonb("answers").$type<{ questionId: string; answer: string | string[]; isCorrect: boolean }[]>(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(users, { fields: [quizAttempts.userId], references: [users.id] }),
  quiz: one(quizzes, { fields: [quizAttempts.quizId], references: [quizzes.id] }),
}));
