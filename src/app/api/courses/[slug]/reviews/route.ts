import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courseReviews, courses } from "@/db/schema";
import { requireMember } from "@/lib/auth-helpers";

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const course = await db.query.courses.findFirst({ where: eq(courses.slug, slug) });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const reviews = await db.query.courseReviews.findMany({
    where: eq(courseReviews.courseId, course.id),
    with: { user: { columns: { id: true, name: true, image: true } } },
    orderBy: [desc(courseReviews.createdAt)],
    limit: 20,
  });
  return NextResponse.json(reviews);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireMember();
    const { slug } = await params;
    const body = await request.json();
    const rating = Number(body.rating);
    const review = body.review ? String(body.review) : null;

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be 1-5" }, { status: 400 });
    }

    const course = await db.query.courses.findFirst({ where: eq(courses.slug, slug) });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const existing = await db.query.courseReviews.findFirst({
      where: and(eq(courseReviews.courseId, course.id), eq(courseReviews.userId, session.user.id)),
    });

    if (existing) {
      const [updated] = await db
        .update(courseReviews)
        .set({ rating, review, updatedAt: new Date() })
        .where(eq(courseReviews.id, existing.id))
        .returning();
      return NextResponse.json(updated);
    }

    const [created] = await db
      .insert(courseReviews)
      .values({
        id: crypto.randomUUID(),
        courseId: course.id,
        userId: session.user.id,
        rating,
        review,
      })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}

