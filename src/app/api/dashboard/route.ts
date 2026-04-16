import { NextResponse } from "next/server";
import { db } from "@/db";
import { videoProgress, certificates, courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/auth-helpers";

// GET /api/dashboard — Dashboard stats for member
export async function GET() {
  try {
    const session = await requireMember();
    const userId = session.user.id;

    // Get all user's video progress
    const allProgress = await db.query.videoProgress.findMany({
      where: eq(videoProgress.userId, userId),
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

    // Build "continue learning" list
    const inProgress = Array.from(courseMap.values())
      .filter((entry) => {
        const totalVids = courseVideoCount.get(entry.course.id) || 1;
        return entry.completedVideos < totalVids;
      })
      .map((entry) => {
        const totalVids = courseVideoCount.get(entry.course.id) || 1;
        return {
          ...entry.course,
          completedVideos: entry.completedVideos,
          totalVideos: totalVids,
          progressPct: Math.round((entry.completedVideos / totalVids) * 100),
          lastVideo: entry.lastVideoTitle,
          lastModule: entry.lastModuleTitle,
        };
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
    const completedCourses = Array.from(courseMap.values()).filter((entry) => {
      const totalVids = courseVideoCount.get(entry.course.id) || 1;
      return entry.completedVideos >= totalVids;
    }).length;

    return NextResponse.json({
      stats: {
        coursesInProgress: inProgress.length,
        coursesCompleted: completedCourses,
        certificatesEarned: certs.length,
        totalVideosWatched: allProgress.filter((p) => p.isCompleted).length,
      },
      continueLearning: inProgress,
      certificates: certs,
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to fetch dashboard:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
