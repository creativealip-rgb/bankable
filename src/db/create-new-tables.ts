import { db } from "./index";
import { sql } from "drizzle-orm";

async function createNewTables() {
  console.log("Creating new tables...");

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "learning_paths" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "title" text NOT NULL,
        "slug" text NOT NULL,
        "description" text,
        "thumbnail" text,
        "order" integer DEFAULT 0,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "learning_paths_slug_unique" UNIQUE("slug")
      );

      CREATE TABLE IF NOT EXISTS "learning_path_courses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "learning_path_id" uuid NOT NULL REFERENCES "learning_paths"("id") ON DELETE CASCADE,
        "course_id" text NOT NULL REFERENCES "course"("id") ON DELETE CASCADE,
        "order" integer DEFAULT 0 NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "title" text NOT NULL,
        "message" text NOT NULL,
        "type" text NOT NULL,
        "link" text,
        "is_read" boolean DEFAULT false NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("Successfully created tables!");
  } catch (error) {
    console.error("Failed to create tables:", error);
  }
}

createNewTables().catch(console.error);
