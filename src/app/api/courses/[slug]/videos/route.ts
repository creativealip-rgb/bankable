import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videos, modules, courses } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import crypto from "crypto";

type RouteParams = { params: Promise<{ slug: string }> };

// POST /api/courses/[slug]/videos — Add video to a module (admin only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;

  try {
    await requireAdmin();
    const body = await request.json();

    const course = await db.query.courses.findFirst({
      where: eq(courses.slug, slug),
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const { moduleId, title, url, duration } = body;

    if (!moduleId || !title) {
      return NextResponse.json(
        { error: "moduleId and title are required" },
        { status: 400 }
      );
    }

    // Verify module belongs to this course
    const mod = await db.query.modules.findFirst({
      where: eq(modules.id, moduleId),
      with: { videos: { orderBy: [asc(videos.order)] } },
    });

    if (!mod || mod.courseId !== course.id) {
      return NextResponse.json({ error: "Module not found in this course" }, { status: 404 });
    }

    const nextOrder = mod.videos.length > 0
      ? Math.max(...mod.videos.map((v) => v.order)) + 1
      : 0;

    const [newVideo] = await db
      .insert(videos)
      .values({
        id: crypto.randomUUID(),
        moduleId,
        title,
        url: url || null,
        duration: duration || 0,
        order: nextOrder,
      })
      .returning();

    return NextResponse.json(newVideo, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to add video:", error);
    return NextResponse.json({ error: "Failed to add video" }, { status: 500 });
  }
}
