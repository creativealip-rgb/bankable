import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, discussionThreads, discussionPosts } from "@/db/schema";
import { requireMember } from "@/lib/auth-helpers";
import { hasCourseLearningAccess } from "@/lib/course-entitlement";

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const course = await db.query.courses.findFirst({ where: eq(courses.slug, slug) });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  if (course.status !== "PUBLISHED") return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const threads = await db.query.discussionThreads.findMany({
    where: eq(discussionThreads.courseId, course.id),
    with: {
      createdBy: { columns: { id: true, name: true, image: true } },
      posts: {
        with: { user: { columns: { id: true, name: true, image: true } } },
        orderBy: (posts, { asc }) => [asc(posts.createdAt)],
      },
    },
    orderBy: (threads, { desc }) => [desc(threads.updatedAt)],
    limit: 20,
  });
  return NextResponse.json(threads);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireMember();
    const { slug } = await params;
    const body = await request.json();
    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    if (!title || !content) {
      return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }

    const course = await db.query.courses.findFirst({ where: eq(courses.slug, slug) });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
    if (course.status !== "PUBLISHED") return NextResponse.json({ error: "Course not found" }, { status: 404 });
    const hasAccess = await hasCourseLearningAccess({
      userId: session.user.id,
      courseSlug: course.slug,
      price: course.price,
    });
    if (!hasAccess) {
      return NextResponse.json({ error: "Active access is required for this course" }, { status: 403 });
    }

    const threadId = crypto.randomUUID();
    await db.insert(discussionThreads).values({
      id: threadId,
      courseId: course.id,
      title,
      createdById: session.user.id,
    });

    const [firstPost] = await db
      .insert(discussionPosts)
      .values({
        id: crypto.randomUUID(),
        threadId,
        userId: session.user.id,
        content,
      })
      .returning();

    return NextResponse.json({ threadId, firstPost }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json({ error: "Failed to create discussion" }, { status: 500 });
  }
}

