import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videoProgress, videos, courses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireMember } from "@/lib/auth-helpers";
import { hasPaidCourseAccess } from "@/lib/course-access";
import crypto from "crypto";

// GET /api/progress?courseSlug=xxx — Get user's progress for a course
export async function GET(request: NextRequest) {
  try {
    const session = await requireMember();
    const { searchParams } = new URL(request.url);
    const courseSlug = searchParams.get("courseSlug");

    if (!courseSlug) {
      return NextResponse.json({ error: "courseSlug is required" }, { status: 400 });
    }

    // Get the course with all its videos
    const course = await db.query.courses.findFirst({
      where: eq(courses.slug, courseSlug),
      with: {
        modules: {
          with: {
            videos: {
              orderBy: (videos, { asc }) => [asc(videos.order)],
            },
          },
          orderBy: (modules, { asc }) => [asc(modules.order)],
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    const isPaidCourse = Number(course.price || 0) > 0;
    if (isPaidCourse) {
      const hasAccess = await hasPaidCourseAccess(session.user.id, course.slug);
      if (!hasAccess) {
        return NextResponse.json({ error: "Premium access required for this course" }, { status: 403 });
      }
    }

    // Get all video IDs for this course
    const videoIds = course.modules.flatMap((m) => m.videos.map((v) => v.id));

    // Get user's progress for these videos
    const progress = await db.query.videoProgress.findMany({
      where: and(
        eq(videoProgress.userId, session.user.id),
        // We'll filter in JS since IN with Drizzle needs special handling
      ),
    });

    // Filter to only this course's videos
    const courseProgress = progress.filter((p) => videoIds.includes(p.videoId));

    // Build a map of videoId → progress
    const progressMap: Record<string, typeof courseProgress[number]> = {};
    for (const p of courseProgress) {
      progressMap[p.videoId] = p;
    }

    // Compute overall course completion
    const completedCount = courseProgress.filter((p) => p.isCompleted).length;
    const totalVideos = videoIds.length;

    return NextResponse.json({
      courseSlug,
      totalVideos,
      completedVideos: completedCount,
      overallProgress: totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0,
      videoProgress: progressMap,
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to fetch progress:", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}

// POST /api/progress — Update video progress (auto-save from player)
export async function POST(request: NextRequest) {
  try {
    const session = await requireMember();
    const body = await request.json();

    const { videoId, watchedPct, lastPosition } = body;

    if (!videoId) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 });
    }

    // Get the video and its course's minWatchPct
    const video = await db.query.videos.findFirst({
      where: eq(videos.id, videoId),
      with: {
        module: {
          with: {
            course: {
              columns: { minWatchPct: true, slug: true, price: true },
            },
          },
        },
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }
    const isPaidCourse = Number(video.module.course.price || 0) > 0;
    if (isPaidCourse) {
      const hasAccess = await hasPaidCourseAccess(session.user.id, video.module.course.slug);
      if (!hasAccess) {
        return NextResponse.json({ error: "Premium access required for this course" }, { status: 403 });
      }
    }

    const minPct = video.module.course.minWatchPct;
    const pct = parseFloat(watchedPct || "0");
    const isCompleted = pct >= minPct;

    // Check if progress exists
    const existing = await db.query.videoProgress.findFirst({
      where: and(
        eq(videoProgress.userId, session.user.id),
        eq(videoProgress.videoId, videoId)
      ),
    });

    if (existing) {
      // Only update if new progress is higher (no going backwards)
      const existingPct = parseFloat(String(existing.watchedPct));
      const [updated] = await db
        .update(videoProgress)
        .set({
          watchedPct: pct > existingPct ? String(pct) : String(existingPct),
          lastPosition: lastPosition ?? existing.lastPosition,
          isCompleted: existing.isCompleted || isCompleted,
          updatedAt: new Date(),
        })
        .where(eq(videoProgress.id, existing.id))
        .returning();

      return NextResponse.json(updated);
    } else {
      // Create new progress entry
      const [created] = await db
        .insert(videoProgress)
        .values({
          id: crypto.randomUUID(),
          userId: session.user.id,
          videoId,
          watchedPct: String(pct),
          lastPosition: lastPosition ?? 0,
          isCompleted,
        })
        .returning();

      return NextResponse.json(created, { status: 201 });
    }
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to update progress:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
