import { NextResponse } from "next/server";
import { db } from "@/db";
import { videoProgress, certificates, courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/auth-helpers";
import { hasPaidCourseAccess } from "@/lib/course-access";

// GET /api/dashboard — Dashboard stats for member
export async function GET() {
  try {
    const session = await requireMember();
    const userId = session.user.id;

    // Get all user's video progress
    const allProgress = await db.query.videoProgress.findMany({
      where: eq(videoProgress.userId, userId),
      orderBy: (videoProgress, { desc }) => [desc(videoProgress.updatedAt)],
      with: {
        video: {
          with: {
            module: {
              with: {
                course: {
                  columns: { id: true, title: true, slug: true, thumbnail: true, category: true },
                },
              },
            },
          },
        },
      },
    });

    // Group progress by course
    const courseMap = new Map<string, {
      course: { id: string; title: string; slug: string; thumbnail: string | null; category: string };
      completedVideos: number;
      totalProgress: number;
      lastVideoTitle: string;
      lastModuleTitle: string;
      lastActivityAt: Date;
    }>();

    for (const p of allProgress) {
      const courseId = p.video.module.course.id;
      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          course: p.video.module.course,
          completedVideos: 0,
          totalProgress: 0,
          lastVideoTitle: p.video.title,
          lastModuleTitle: p.video.module.title,
          lastActivityAt: p.updatedAt,
        });
      }
      const entry = courseMap.get(courseId)!;
      if (p.isCompleted) entry.completedVideos++;
      entry.totalProgress += parseFloat(String(p.watchedPct));
    }

    // Get all published courses to calculate total videos per course
    const publishedCourses = await db.query.courses.findMany({
      where: eq(courses.status, "PUBLISHED"),
      with: {
        modules: {
          with: { videos: true },
        },
      },
    });

    const courseVideoCount = new Map<string, number>();
    for (const c of publishedCourses) {
      const total = c.modules.reduce((sum, m) => sum + m.videos.length, 0);
      courseVideoCount.set(c.id, total);
    }

    // Build full accessible course list (including enrolled but not yet started)
    const continueLearning = [];
    for (const c of publishedCourses) {
      const isPaidCourse = Number(c.price || 0) > 0;
      if (isPaidCourse) {
        const hasAccess = await hasPaidCourseAccess(userId, c.slug);
        if (!hasAccess) continue;
      }

      const totalVids = courseVideoCount.get(c.id) || 1;
      const progressEntry = courseMap.get(c.id);
      const firstModule = c.modules[0];
      const firstVideo = firstModule?.videos?.[0];

      continueLearning.push({
        id: c.id,
        title: c.title,
        slug: c.slug,
        thumbnail: c.thumbnail,
        category: c.category,
        completedVideos: progressEntry?.completedVideos || 0,
        totalVideos: totalVids,
        progressPct: Math.round(((progressEntry?.completedVideos || 0) / totalVids) * 100),
        lastVideo: progressEntry?.lastVideoTitle || firstVideo?.title || "Belum mulai",
        lastModule: progressEntry?.lastModuleTitle || firstModule?.title || "Belum ada modul",
        _lastActivityAt: progressEntry?.lastActivityAt || null,
      });
    }

    continueLearning.sort((a, b) => {
      if (a._lastActivityAt && b._lastActivityAt) return b._lastActivityAt.getTime() - a._lastActivityAt.getTime();
      if (a._lastActivityAt) return -1;
      if (b._lastActivityAt) return 1;
      return a.title.localeCompare(b.title);
    });

    // Certificates
    const certs = await db.query.certificates.findMany({
      where: eq(certificates.userId, userId),
      with: {
        course: { columns: { id: true, title: true, slug: true } },
      },
      orderBy: (certificates, { desc }) => [desc(certificates.issuedAt)],
    });

    // Stats
    const completedCourses = continueLearning.filter((c) => c.progressPct >= 100).length;
    const coursesInProgress = continueLearning.filter((c) => c.progressPct > 0 && c.progressPct < 100).length;

    return NextResponse.json({
      stats: {
        coursesInProgress,
        coursesCompleted: completedCourses,
        certificatesEarned: certs.length,
        totalVideosWatched: allProgress.filter((p) => p.isCompleted).length,
      },
      continueLearning: continueLearning.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        thumbnail: item.thumbnail,
        category: item.category,
        completedVideos: item.completedVideos,
        totalVideos: item.totalVideos,
        progressPct: item.progressPct,
        lastVideo: item.lastVideo,
        lastModule: item.lastModule,
      })),
      certificates: certs,
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to fetch dashboard:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
