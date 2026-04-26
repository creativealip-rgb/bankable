import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, courses, modules, videos, videoProgress, certificates, memberships, quizAttempts, sessions, payments } from "@/db/schema";
import { and, count, desc, eq, gte, inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import { paymentHasCourseSlug } from "@/lib/course-access";

// GET /api/admin/stats — Admin dashboard analytics
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get("range") || "30D").toUpperCase();
    const roleFilter = (searchParams.get("role") || "MEMBER").toUpperCase();
    const memberStatus = (searchParams.get("memberStatus") || "ALL").toUpperCase();

    const now = new Date();
    const rangeDays =
      range === "7D" ? 7 :
      range === "30D" ? 30 :
      range === "90D" ? 90 :
      range === "180D" ? 180 :
      null;
    const rangeStart = rangeDays ? new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000) : null;
    const bucketMode = rangeDays && rangeDays <= 30 ? "day" : "month";

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
    const [activeSessions] = await db
      .select({ count: count() })
      .from(sessions)
      .where(gte(sessions.expiresAt, now));

    const registeredUsers = await db.query.users.findMany({
      where: and(
        rangeStart ? gte(users.createdAt, rangeStart) : undefined,
        roleFilter !== "ALL" ? eq(users.role, roleFilter) : undefined
      ),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: [desc(users.createdAt)],
    });

    const registeredUserIds = registeredUsers.map((user) => user.id);
    const activeMembershipRows = registeredUserIds.length
      ? await db.query.memberships.findMany({
          where: and(inArray(memberships.userId, registeredUserIds), eq(memberships.status, "ACTIVE")),
          columns: {
            userId: true,
            tier: true,
            createdAt: true,
          },
          orderBy: [desc(memberships.createdAt)],
        })
      : [];

    const latestMembershipByUser = new Map<string, { tier: string; createdAt: Date }>();
    for (const row of activeMembershipRows) {
      if (!latestMembershipByUser.has(row.userId)) {
        latestMembershipByUser.set(row.userId, { tier: row.tier, createdAt: row.createdAt });
      }
    }

    const withMembership = registeredUsers.map((user) => {
      const activeMembership = latestMembershipByUser.get(user.id);
      const tier = activeMembership?.tier || "FREE";
      const isMember = tier !== "FREE";
      return {
        ...user,
        tier,
        isMember,
        memberAt: activeMembership?.createdAt || null,
      };
    });

    const filteredRegisteredUsers = withMembership.filter((user) => {
      if (memberStatus === "PAID_MEMBER") return user.isMember;
      if (memberStatus === "FREE_ONLY") return !user.isMember;
      return true;
    });

    const registeredTotal = filteredRegisteredUsers.length;
    const becameMemberTotal = filteredRegisteredUsers.filter((user) => user.isMember).length;
    const conversionRate = registeredTotal > 0 ? Number(((becameMemberTotal / registeredTotal) * 100).toFixed(1)) : 0;
    const paidMemberTotal = filteredRegisteredUsers.filter((user) => user.tier === "BASIC" || user.tier === "PREMIUM" || user.tier === "LIFETIME").length;
    const freeMemberTotal = filteredRegisteredUsers.filter((user) => user.tier === "FREE").length;

    const formatBucket = (date: Date) => {
      if (bucketMode === "day") {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      }
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    };

    const bucketLabel = (key: string) => {
      if (bucketMode === "day") {
        const [year, month, day] = key.split("-").map((v) => Number(v));
        return new Date(year, month - 1, day).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      }
      const [year, month] = key.split("-").map((v) => Number(v));
      return new Date(year, month - 1, 1).toLocaleDateString("id-ID", { month: "short", year: "numeric" });
    };

    const timelineMap = new Map<string, { registered: number; becameMember: number }>();
    for (const user of filteredRegisteredUsers) {
      const key = formatBucket(user.createdAt);
      const current = timelineMap.get(key) || { registered: 0, becameMember: 0 };
      current.registered += 1;
      if (user.isMember) current.becameMember += 1;
      timelineMap.set(key, current);
    }

    const timeline = [...timelineMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => ({
        periodKey: key,
        periodLabel: bucketLabel(key),
        registered: value.registered,
        becameMember: value.becameMember,
        conversionRate: value.registered > 0 ? Number(((value.becameMember / value.registered) * 100).toFixed(1)) : 0,
      }));

    const recentConversions = filteredRegisteredUsers
      .filter((user) => user.isMember)
      .sort((a, b) => {
        const aTime = userDate(a.memberAt, a.createdAt);
        const bTime = userDate(b.memberAt, b.createdAt);
        return bTime - aTime;
      })
      .slice(0, 12)
      .map((user) => ({
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tier: user.tier,
        registeredAt: user.createdAt,
        becameMemberAt: user.memberAt || user.createdAt,
      }));

    const paidPayments = await db.query.payments.findMany({
      where: eq(payments.status, "PAID"),
      columns: {
        tier: true,
        amount: true,
        providerPayload: true,
        paidAt: true,
        createdAt: true,
      },
      with: {
        user: {
          columns: {
            role: true,
          },
        },
      },
      orderBy: [desc(payments.createdAt)],
      limit: 5000,
    });

    const matchesRole = (userRole: string) => roleFilter === "ALL" || userRole === roleFilter;
    const inRange = (date: Date) => !rangeStart || date >= rangeStart;
    const amountValue = (raw: string) => {
      const value = Number(raw);
      return Number.isFinite(value) ? value : 0;
    };

    let memberSignupRevenue = 0;
    let premiumWebinarRevenue = 0;
    let memberSignupTransactions = 0;
    let premiumWebinarTransactions = 0;
    const revenueTimelineMap = new Map<string, number>();

    for (const payment of paidPayments) {
      if (!payment.user || !matchesRole(payment.user.role)) continue;
      const eventDate = payment.paidAt ?? payment.createdAt;
      if (!inRange(eventDate)) continue;

      const amount = amountValue(payment.amount);
      const isPremiumCoursePayment = payment.tier === "PREMIUM" && paymentHasCourseSlug(payment.providerPayload);
      const isMemberSignupPayment =
        payment.tier === "BASIC" ||
        payment.tier === "LIFETIME" ||
        (payment.tier === "PREMIUM" && !isPremiumCoursePayment);

      if (isPremiumCoursePayment) {
        premiumWebinarRevenue += amount;
        premiumWebinarTransactions += 1;
      } else if (isMemberSignupPayment) {
        memberSignupRevenue += amount;
        memberSignupTransactions += 1;
      }

      const key = formatBucket(eventDate);
      revenueTimelineMap.set(key, (revenueTimelineMap.get(key) || 0) + amount);
    }

    const revenueTimeline = [...revenueTimelineMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => ({
        periodKey: key,
        periodLabel: bucketLabel(key),
        revenue: Number(value.toFixed(2)),
      }));

    const revenue = {
      memberSignup: Number(memberSignupRevenue.toFixed(2)),
      premiumWebinar: Number(premiumWebinarRevenue.toFixed(2)),
      total: Number((memberSignupRevenue + premiumWebinarRevenue).toFixed(2)),
      memberSignupTransactions,
      premiumWebinarTransactions,
      timeline: revenueTimeline,
    };

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
      memberGrowth: {
        filters: {
          range,
          role: roleFilter,
          memberStatus,
        },
        totals: {
          registered: registeredTotal,
          becameMember: becameMemberTotal,
          conversionRate,
          paidMember: paidMemberTotal,
          freeOnly: freeMemberTotal,
        },
        timeline,
        recentConversions,
      },
      revenue,
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to fetch admin stats:", error);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
}

function userDate(memberAt: Date | null, fallback: Date) {
  return memberAt ? memberAt.getTime() : fallback.getTime();
}
