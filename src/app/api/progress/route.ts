import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videoProgress, videos, courses, users } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { requireMember } from "@/lib/auth-helpers";
import { hasCourseLearningAccess } from "@/lib/course-entitlement";
import crypto from "crypto";

function isTrackableVideoSource(url: string | null): boolean {
  const value = (url || "").trim().toLowerCase();
  if (!value) return false;
  if (value.startsWith("blob:")) return true;
  const normalized = value.split("?")[0];
  return normalized.endsWith(".mp4") || normalized.endsWith(".webm") || normalized.endsWith(".ogg");
}

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
    const hasAccess = await hasCourseLearningAccess({
      userId: session.user.id,
      courseSlug: course.slug,
      price: course.price,
    });
    if (!hasAccess) {
      return NextResponse.json({ error: "Active access is required for this course" }, { status: 403 });
    }

    // Get all video IDs for this course
    const videoIds = course.modules.flatMap((m) => m.videos.map((v) => v.id));

    // Get user's progress for these videos
    const courseProgress = videoIds.length
      ? await db.query.videoProgress.findMany({
          where: and(eq(videoProgress.userId, session.user.id), inArray(videoProgress.videoId, videoIds)),
        })
      : [];

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
    const hasAccess = await hasCourseLearningAccess({
      userId: session.user.id,
      courseSlug: video.module.course.slug,
      price: video.module.course.price,
    });
    if (!hasAccess && !video.isPreview) {
      return NextResponse.json({ error: "Active access is required for this course" }, { status: 403 });
    }

    const isTrackable = isTrackableVideoSource(video.url);
    const duration = Math.max(video.duration || 0, 0);
    const requestedPosition = Number(lastPosition ?? 0);
    const sanitizedRequestedPosition = Number.isFinite(requestedPosition)
      ? Math.max(0, Math.min(Math.floor(requestedPosition), duration))
      : 0;
    const pctFromPosition = duration > 0 ? (sanitizedRequestedPosition / duration) * 100 : 0;
    const clientPct = Number(watchedPct ?? 0);
    const sanitizedClientPct = Number.isFinite(clientPct) ? Math.max(0, Math.min(clientPct, 100)) : 0;
    const minPct = video.module.course.minWatchPct;

    // For untrackable sources (youtube/pdf/audio), we still allow manual progress input from client.
    const desiredPct = isTrackable ? pctFromPosition : Math.max(pctFromPosition, sanitizedClientPct);

    let effectivePct = desiredPct;
    let effectivePosition = sanitizedRequestedPosition;

    const existing = await db.query.videoProgress.findFirst({
      where: and(
        eq(videoProgress.userId, session.user.id),
        eq(videoProgress.videoId, videoId)
      ),
    });

    if (existing) {
      const existingPct = parseFloat(String(existing.watchedPct));
      // Anti-cheat guard for trackable sources: cap forward jump to 3 minutes per save.
      if (isTrackable && effectivePosition > existing.lastPosition + 180) {
        effectivePosition = Math.min(existing.lastPosition + 180, duration);
        effectivePct = duration > 0 ? (effectivePosition / duration) * 100 : effectivePct;
      }
      effectivePct = Math.max(existingPct, effectivePct);
    }

    const isCompleted = effectivePct >= minPct;

    if (existing) {
      const [updated] = await db
        .update(videoProgress)
        .set({
          watchedPct: String(effectivePct),
          lastPosition: Math.max(existing.lastPosition, effectivePosition),
          isCompleted: existing.isCompleted || isCompleted,
          updatedAt: new Date(),
        })
        .where(eq(videoProgress.id, existing.id))
        .returning();

      // Award XP if first time completed
      if (isCompleted && !existing.isCompleted) {
        const currentUser = await db.query.users.findFirst({
          where: eq(users.id, session.user.id),
        });
        if (currentUser) {
          const newXp = (currentUser.xp || 0) + 100;
          const newLevel = Math.floor(newXp / 1000) + 1;
          await db.update(users)
            .set({ xp: newXp, level: newLevel, updatedAt: new Date() })
            .where(eq(users.id, session.user.id));
        }
      }

      return NextResponse.json(updated);
    } else {
      // Create new progress entry
      const [created] = await db
        .insert(videoProgress)
        .values({
          id: crypto.randomUUID(),
          userId: session.user.id,
          videoId,
          watchedPct: String(effectivePct),
          lastPosition: effectivePosition,
          isCompleted,
        })
        .returning();

      // Award XP if created as completed
      if (isCompleted) {
        const currentUser = await db.query.users.findFirst({
          where: eq(users.id, session.user.id),
        });
        if (currentUser) {
          const newXp = (currentUser.xp || 0) + 100;
          const newLevel = Math.floor(newXp / 1000) + 1;
          await db.update(users)
            .set({ xp: newXp, level: newLevel, updatedAt: new Date() })
            .where(eq(users.id, session.user.id));
        }
      }

      return NextResponse.json(created, { status: 201 });
    }
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to update progress:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
