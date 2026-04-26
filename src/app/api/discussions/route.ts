import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { discussionThreads, discussionPosts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireMember } from "@/lib/auth-helpers";
import crypto from "crypto";

// GET /api/discussions?courseId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    const threads = await db.query.discussionThreads.findMany({
      where: eq(discussionThreads.courseId, courseId),
      orderBy: [desc(discussionThreads.createdAt)],
      with: {
        createdBy: {
          columns: { id: true, name: true, image: true },
        },
        posts: {
          limit: 1,
          orderBy: [desc(discussionPosts.createdAt)],
        },
      },
    });

    return NextResponse.json(threads);
  } catch (error) {
    console.error("Failed to fetch discussions:", error);
    return NextResponse.json({ error: "Failed to fetch discussions" }, { status: 500 });
  }
}

// POST /api/discussions
export async function POST(request: NextRequest) {
  try {
    const session = await requireMember();
    const body = await request.json();
    const { courseId, title, content } = body;

    if (!courseId || !title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const threadId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(discussionThreads).values({
        id: threadId,
        courseId,
        title,
        createdById: session.user.id,
      });

      await tx.insert(discussionPosts).values({
        id: crypto.randomUUID(),
        threadId,
        userId: session.user.id,
        content,
      });
    });

    return NextResponse.json({ id: threadId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create discussion:", error);
    return NextResponse.json({ error: "Failed to create discussion" }, { status: 500 });
  }
}
