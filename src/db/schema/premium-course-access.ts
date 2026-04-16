import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { payments } from "./payments";

export const premiumCourseAccess = pgTable(
  "premium_course_access",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseSlug: text("course_slug").notNull(),
    sourcePaymentId: text("source_payment_id").references(() => payments.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqUserCourse: uniqueIndex("premium_course_access_user_course_idx").on(table.userId, table.courseSlug),
    courseSlugIdx: index("premium_course_access_course_slug_idx").on(table.courseSlug),
  })
);

export const premiumCourseAccessRelations = relations(premiumCourseAccess, ({ one }) => ({
  user: one(users, { fields: [premiumCourseAccess.userId], references: [users.id] }),
  payment: one(payments, { fields: [premiumCourseAccess.sourcePaymentId], references: [payments.id] }),
}));

