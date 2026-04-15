import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, courses, modules, videos, videoProgress, certificates, memberships, quizAttempts, sessions } from "@/db/schema";
import { eq, count, sql, desc, gte } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";

// GET /api/admin/stats — Admin dashboard analytics
export async function GET() {
  try {
    await requireAdmin();

    // Total counts
    const [userCount] = await db.select({ count: count() }).from(users);
    const [courseCount] = await db.select({ count: count() }).from(courses);
    const [videoCount] = await db.select({ count: count() }).from(videos);
    const [certCount] = await db.select({ count: count() }).from(certificates);
    const [progressCount] = await db.select({ count: count() }).from(videoProgress);
    const [attemptCount] = await db.select({ count: count() }).from(quizAttempts);

    // Users registered in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [recentUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, sevenDaysAgo));

    // Users by role
    const usersByRole = await db
      .select({ role: users.role, count: count() })
      .from(users)
      .groupBy(users.role);

    // Courses by status
    const coursesByStatus = await db
      .select({ status: courses.status, count: count() })
      .from(courses)
      .groupBy(courses.status);

    // Courses by category
    const coursesByCategory = await db
      .select({ category: courses.category, count: count() })
      .from(courses)
      .groupBy(courses.category);

    // Membership distribution
    const membershipsByTier = await db
      .select({ tier: memberships.tier, count: count() })
      .from(memberships)
      .where(eq(memberships.status, "ACTIVE"))
      .groupBy(memberships.tier);

    // Recent users (last 10)
    const recentUsersList = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      limit: 10,
      columns: { id: true, name: true, email: true, role: true, createdAt: true, image: true },
    });

    // Top courses by video progress (most progressed)
    const topCourses = await db
      .select({
        courseId: courses.id,
        title: courses.title,
        slug: courses.slug,
        category: courses.category,
        status: courses.status,
        progressCount: count(videoProgress.id),
      })
      .from(courses)
      .leftJoin(modules, eq(modules.courseId, courses.id))
      .leftJoin(videos, eq(videos.moduleId, modules.id))
      .leftJoin(videoProgress, eq(videoProgress.videoId, videos.id))
      .groupBy(courses.id, courses.title, courses.slug, courses.category, courses.status)
      .orderBy(desc(count(videoProgress.id)))
      .limit(5);

    // Active sessions count
    const now = new Date();
    const [activeSessions] = await db
      .select({ count: count() })
      .from(sessions)
      .where(gte(sessions.expiresAt, now));

    return NextResponse.json({
      overview: {
        totalUsers: userCount.count,
        totalCourses: courseCount.count,
        totalVideos: videoCount.count,
        totalCertificates: certCount.count,
        totalVideoProgress: progressCount.count,
        totalQuizAttempts: attemptCount.count,
        newUsersLast7Days: recentUsers.count,
        activeSessions: activeSessions.count,
      },
      usersByRole,
      coursesByStatus,
      coursesByCategory,
      membershipsByTier,
      recentUsers: recentUsersList,
      topCourses,
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to fetch admin stats:", error);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
}
