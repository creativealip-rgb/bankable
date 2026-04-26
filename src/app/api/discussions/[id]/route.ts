import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { discussionThreads, discussionPosts } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireMember } from "@/lib/auth-helpers";
import crypto from "crypto";

type Params = { params: Promise<{ id: string }> };

// GET /api/discussions/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const thread = await db.query.discussionThreads.findFirst({
      where: eq(discussionThreads.id, id),
      with: {
        createdBy: {
          columns: { id: true, name: true, image: true },
        },
        posts: {
          orderBy: [asc(discussionPosts.createdAt)],
          with: {
            user: {
              columns: { id: true, name: true, image: true },
            },
          },
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json(thread);
  } catch (error) {
    console.error("Failed to fetch thread:", error);
    return NextResponse.json({ error: "Failed to fetch thread" }, { status: 500 });
  }
}

// POST /api/discussions/[id]/posts
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await requireMember();
    const { id: threadId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const [post] = await db.insert(discussionPosts).values({
      id: crypto.randomUUID(),
      threadId,
      userId: session.user.id,
      content,
    }).returning();

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Failed to add post:", error);
    return NextResponse.json({ error: "Failed to add post" }, { status: 500 });
  }
}
