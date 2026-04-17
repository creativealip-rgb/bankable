import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { eq, desc, and, ilike } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import crypto from "crypto";
import { writeAdminAudit } from "@/lib/admin-audit";
import { logError } from "@/lib/logger";
import { getSidebarPaidCourseSlugSet } from "@/lib/course-entitlement";
import { inferCourseContentType } from "@/lib/course-content-type";

type SortOption = "NEWEST" | "OLDEST" | "TITLE_ASC" | "TITLE_DESC" | "DURATION_DESC";

function parseSort(input: string | null): SortOption {
  const value = String(input || "").trim().toUpperCase();
  if (value === "OLDEST" || value === "TITLE_ASC" || value === "TITLE_DESC" || value === "DURATION_DESC") {
    return value;
  }
  return "NEWEST";
}

function compareBySort(sort: SortOption) {
  return (
    a: { title: string; totalDuration: number; createdAt: Date | null },
    b: { title: string; totalDuration: number; createdAt: Date | null }
  ) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (sort === "OLDEST") return aTime - bTime;
    if (sort === "TITLE_ASC") return a.title.localeCompare(b.title, "id");
    if (sort === "TITLE_DESC") return b.title.localeCompare(a.title, "id");
    if (sort === "DURATION_DESC") return b.totalDuration - a.totalDuration;
    return bTime - aTime;
  };
}

// GET /api/courses — List all published courses (public)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category")?.trim() || null;
  const level = searchParams.get("level")?.trim().toUpperCase() || null;
  const contentType = searchParams.get("contentType")?.trim().toUpperCase() || null;
  const type = searchParams.get("type")?.trim().toUpperCase() || null;
  const search = searchParams.get("search")?.trim() || null;
  const sort = parseSort(searchParams.get("sort"));

  try {
    const allCourses = await db.query.courses.findMany({
      where: and(
        eq(courses.status, "PUBLISHED"),
        category ? eq(courses.category, category) : undefined,
        level ? eq(courses.level, level) : undefined,
        type ? eq(courses.type, type) : undefined,
        search ? ilike(courses.title, `%${search}%`) : undefined
      ),
      with: {
        modules: {
          with: {
            videos: true,
          },
          orderBy: (modules, { asc }) => [asc(modules.order)],
        },
        createdBy: {
          columns: { id: true, name: true, image: true },
        },
      },
      orderBy: [desc(courses.createdAt)],
    });

    const paidSidebarSlugs = await getSidebarPaidCourseSlugSet();

    // Add computed fields and hide paid premium/webinar from main course catalog
    const enrichedCourses = allCourses.map((course) => {
      const totalVideos = course.modules.reduce((sum, mod) => sum + mod.videos.length, 0);
      const totalDuration = course.modules.reduce(
        (sum, mod) => sum + mod.videos.reduce((vSum, v) => vSum + v.duration, 0),
        0
      );
      const inferredContentType = inferCourseContentType({
        title: course.title,
        category: course.category,
        type: course.type,
        totalVideos,
      });
      return {
        ...course,
        totalVideos,
        totalDuration,
        totalModules: course.modules.length,
        contentType: inferredContentType,
      };
    })
      .filter((course) => Number(course.price || 0) <= 0 && !paidSidebarSlugs.has(course.slug))
      .filter((course) => (contentType && contentType !== "ALL" ? course.contentType === contentType : true))
      .sort(compareBySort(sort));

    return NextResponse.json(enrichedCourses);
  } catch (error) {
    logError("courses.list.failed", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

// POST /api/courses — Create a new course (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();

    const { title, description, type, category, level, thumbnail, status, price, minWatchPct } = body;

    if (!title || !category) {
      return NextResponse.json(
        { error: "Title and category are required" },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const id = crypto.randomUUID();
    const parsedPrice = Number(price ?? 0);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: "Invalid price value" }, { status: 400 });
    }
    const parsedMinWatchPct = Number(minWatchPct ?? 90);
    if (!Number.isFinite(parsedMinWatchPct) || parsedMinWatchPct < 1 || parsedMinWatchPct > 100) {
      return NextResponse.json({ error: "minWatchPct must be between 1-100" }, { status: 400 });
    }

    const [newCourse] = await db
      .insert(courses)
      .values({
        id,
        title,
        slug,
        description: description || null,
        type: type || "MULTI",
        category,
        level: level || "BEGINNER",
        thumbnail: thumbnail || null,
        price: String(parsedPrice),
        status: status || "DRAFT",
        minWatchPct: Math.floor(parsedMinWatchPct),
        createdById: session.user.id,
      })
      .returning();
    await writeAdminAudit({
      actorUserId: session.user.id,
      action: "ADMIN_COURSE_CREATED",
      entityType: "course",
      entityId: newCourse.id,
      metadata: { slug: newCourse.slug, status: newCourse.status },
    });

    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    logError("courses.create.failed", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
