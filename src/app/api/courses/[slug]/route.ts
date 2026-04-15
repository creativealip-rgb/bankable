import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";

type RouteParams = { params: Promise<{ slug: string }> };

// GET /api/courses/[slug] — Get single course detail (public)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;

  try {
    const course = await db.query.courses.findFirst({
      where: eq(courses.slug, slug),
      with: {
        modules: {
          with: {
            videos: {
              orderBy: (videos, { asc }) => [asc(videos.order)],
            },
          },
          orderBy: (modules, { asc }) => [asc(modules.order)],
        },
        quiz: {
          columns: {
            id: true,
            title: true,
            passingGrade: true,
            timeLimit: true,
            maxAttempts: true,
          },
        },
        createdBy: {
          columns: { id: true, name: true, image: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Compute totals
    const totalVideos = course.modules.reduce((sum, mod) => sum + mod.videos.length, 0);
    const totalDuration = course.modules.reduce(
      (sum, mod) => sum + mod.videos.reduce((vSum, v) => vSum + v.duration, 0),
      0
    );

    return NextResponse.json({
      ...course,
      totalVideos,
      totalDuration,
      totalModules: course.modules.length,
    });
  } catch (error) {
    console.error("Failed to fetch course:", error);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

// PUT /api/courses/[slug] — Update course (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;

  try {
    await requireAdmin();
    const body = await request.json();

    const existing = await db.query.courses.findFirst({
      where: eq(courses.slug, slug),
    });

    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const { title, description, type, category, level, thumbnail, price, status, minWatchPct } = body;

    const [updated] = await db
      .update(courses)
      .set({
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(category && { category }),
        ...(level && { level }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(price !== undefined && { price: price ? String(price) : null }),
        ...(status && { status }),
        ...(minWatchPct && { minWatchPct }),
        updatedAt: new Date(),
      })
      .where(eq(courses.id, existing.id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to update course:", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

// DELETE /api/courses/[slug] — Delete course (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;

  try {
    await requireAdmin();

    const existing = await db.query.courses.findFirst({
      where: eq(courses.slug, slug),
    });

    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    await db.delete(courses).where(eq(courses.id, existing.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to delete course:", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
