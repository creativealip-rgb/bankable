import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { desc, eq, ilike, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";

// GET /api/admin/courses — List ALL courses (including DRAFT/ARCHIVED)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const allCourses = await db.query.courses.findMany({
      where: and(
        status ? eq(courses.status, status) : undefined,
        search ? ilike(courses.title, `%${search}%`) : undefined,
      ),
      with: {
        modules: {
          with: { videos: true },
          orderBy: (modules, { asc }) => [asc(modules.order)],
        },
        createdBy: {
          columns: { id: true, name: true },
        },
        quiz: {
          columns: { id: true },
        },
      },
      orderBy: [desc(courses.createdAt)],
    });

    const enriched = allCourses.map((course) => {
      const totalVideos = course.modules.reduce((s, m) => s + m.videos.length, 0);
      const totalDuration = course.modules.reduce(
        (s, m) => s + m.videos.reduce((vs, v) => vs + v.duration, 0),
        0
      );
      return {
        ...course,
        totalVideos,
        totalDuration,
        totalModules: course.modules.length,
        hasQuiz: course.quiz.length > 0,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to fetch admin courses:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
