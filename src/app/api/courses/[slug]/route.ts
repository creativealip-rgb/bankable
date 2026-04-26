import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, requireAdmin } from "@/lib/auth-helpers";
import { hasPaidCourseAccess } from "@/lib/course-access";
import { hasMainCatalogAccess, isPaidOfferingCourse } from "@/lib/course-entitlement";
import { writeAdminAudit } from "@/lib/admin-audit";
import { logError } from "@/lib/logger";

type RouteParams = { params: Promise<{ slug: string }> };
const VALID_STATUSES = new Set(["DRAFT", "PUBLISHED", "ARCHIVED"]);

// GET /api/courses/[slug] — Get single course detail (public)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;

  try {
    const session = await getSession();
    const role = (session?.user as Record<string, unknown> | undefined)?.role as string | undefined;
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

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
    if (course.status !== "PUBLISHED" && !isAdmin) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const isPaidCourse = await isPaidOfferingCourse(course.slug, course.price);
    const hasPremiumAccess = !isPaidCourse || (session ? await hasPaidCourseAccess(session.user.id, slug) : false);
    const hasMainAccess = isPaidCourse ? true : (session ? await hasMainCatalogAccess(session.user.id) : false);
    const hasCourseAccess = isPaidCourse ? hasPremiumAccess : hasMainAccess;

    const sanitizedModules = course.modules.map((mod) => ({
      ...mod,
      videos: mod.videos.map((video) => ({
        ...video,
        url: hasCourseAccess || video.isPreview ? video.url : null,
        subtitleUrl: hasCourseAccess || video.isPreview ? video.subtitleUrl : null,
      })),
    }));

    // Compute totals
    const totalVideos = sanitizedModules.reduce((sum, mod) => sum + mod.videos.length, 0);
    const totalDuration = sanitizedModules.reduce(
      (sum, mod) => sum + mod.videos.reduce((vSum, v) => vSum + v.duration, 0),
      0
    );

    return NextResponse.json({
      ...course,
      modules: sanitizedModules,
      totalVideos,
      totalDuration,
      totalModules: sanitizedModules.length,
      isPaidOffering: isPaidCourse,
      hasPremiumAccess,
      hasMainAccess,
      hasCourseAccess,
    });
  } catch (error) {
    logError("courses.slug.get.failed", error, { slug });
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

// PUT /api/courses/[slug] — Update course (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;

  try {
    const session = await requireAdmin();
    const body = await request.json();

    const existing = await db.query.courses.findFirst({
      where: eq(courses.slug, slug),
    });

    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const { title, description, type, category, level, thumbnail, status, minWatchPct, price } = body;
    const parsedPrice = Number(price ?? existing.price ?? 0);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: "Invalid price value" }, { status: 400 });
    }
    const normalizedStatus = typeof status === "string" ? status.toUpperCase() : undefined;
    if (normalizedStatus && !VALID_STATUSES.has(normalizedStatus)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }
    const nextMinWatchPct = Number(minWatchPct);
    const normalizedMinWatchPct =
      Number.isFinite(nextMinWatchPct) && nextMinWatchPct >= 1 && nextMinWatchPct <= 100
        ? Math.floor(nextMinWatchPct)
        : undefined;

    const [updated] = await db
      .update(courses)
      .set({
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(category && { category }),
        ...(level && { level }),
        ...(thumbnail !== undefined && { thumbnail }),
        price: String(parsedPrice),
        ...(normalizedStatus && { status: normalizedStatus }),
        ...(normalizedMinWatchPct !== undefined && { minWatchPct: normalizedMinWatchPct }),
        updatedAt: new Date(),
      })
      .where(eq(courses.id, existing.id))
      .returning();

    if (existing.status !== updated.status) {
      await writeAdminAudit({
        actorUserId: session.user.id,
        action: "ADMIN_COURSE_STATUS_CHANGED",
        entityType: "course",
        entityId: updated.id,
        metadata: {
          slug: updated.slug,
          from: existing.status,
          to: updated.status,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Response) throw error;
    logError("courses.slug.update.failed", error, { slug });
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

// DELETE /api/courses/[slug] — Delete course (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;

  try {
    const session = await requireAdmin();

    const existing = await db.query.courses.findFirst({
      where: eq(courses.slug, slug),
    });

    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    await db.delete(courses).where(eq(courses.id, existing.id));
    await writeAdminAudit({
      actorUserId: session.user.id,
      action: "ADMIN_COURSE_DELETED",
      entityType: "course",
      entityId: existing.id,
      metadata: { slug: existing.slug, title: existing.title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) throw error;
    logError("courses.slug.delete.failed", error, { slug });
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
