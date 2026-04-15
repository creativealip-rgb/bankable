import { pgTable, text, integer, boolean, numeric, timestamp, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { videos } from "./courses";

export const videoProgress = pgTable(
  "video_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    watchedPct: numeric("watched_pct", { precision: 5, scale: 2 }).notNull().default("0"),
    lastPosition: integer("last_position").notNull().default(0), // in seconds
    isCompleted: boolean("is_completed").notNull().default(false),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("video_progress_user_video").on(table.userId, table.videoId),
  ]
);

export const videoProgressRelations = relations(videoProgress, ({ one }) => ({
  user: one(users, { fields: [videoProgress.userId], references: [users.id] }),
  video: one(videos, { fields: [videoProgress.videoId], references: [videos.id] }),
}));
