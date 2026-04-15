import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { courses, modules } from "@/db/schema";
import { eq, desc, and, ilike } from "drizzle-orm";
import { getSession, requireAdmin } from "@/lib/auth-helpers";
import crypto from "crypto";

// GET /api/courses — List all published courses (public)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const search = searchParams.get("search");

  try {
    const allCourses = await db.query.courses.findMany({
      where: and(
        eq(courses.status, "PUBLISHED"),
        category ? eq(courses.category, category) : undefined,
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

    // Add computed fields
    const enrichedCourses = allCourses.map((course) => {
      const totalVideos = course.modules.reduce((sum, mod) => sum + mod.videos.length, 0);
      const totalDuration = course.modules.reduce(
        (sum, mod) => sum + mod.videos.reduce((vSum, v) => vSum + v.duration, 0),
        0
      );
      return {
        ...course,
        totalVideos,
        totalDuration,
        totalModules: course.modules.length,
      };
    });

    return NextResponse.json(enrichedCourses);
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

// POST /api/courses — Create a new course (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();

    const { title, description, type, category, level, thumbnail, price, status } = body;

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
        price: price ? String(price) : null,
        status: status || "DRAFT",
        createdById: session.user.id,
      })
      .returning();

    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to create course:", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
