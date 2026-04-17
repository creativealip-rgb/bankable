import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";
import { parsePagination } from "@/lib/pagination";

// GET /api/admin/users — List all users with stats
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const { page, pageSize, offset } = parsePagination(searchParams, { pageSize: 20 });
    const search = String(searchParams.get("search") || searchParams.get("q") || "").trim();
    const role = String(searchParams.get("role") || "").trim().toUpperCase();

    const whereClause = and(
      role ? eq(users.role, role) : undefined,
      search ? or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)) : undefined
    );

    const [totalRow] = await db.select({ count: count() }).from(users).where(whereClause);

    const allUsers = await db.query.users.findMany({
      where: whereClause,
      orderBy: [desc(users.createdAt)],
      limit: pageSize,
      offset,
      with: {
        memberships: {
          columns: { tier: true, status: true },
        },
        certificates: {
          columns: { id: true },
        },
        videoProgress: {
          columns: { id: true, isCompleted: true },
        },
      },
    });

    const enriched = allUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      image: u.image,
      createdAt: u.createdAt,
      membership: u.memberships.find((m) => m.status === "ACTIVE")?.tier || "FREE",
      certificateCount: u.certificates.length,
      videosWatched: u.videoProgress.filter((p) => p.isCompleted).length,
      totalProgress: u.videoProgress.length,
    }));

    return NextResponse.json({
      items: enriched,
      pagination: {
        page,
        pageSize,
        total: totalRow?.count || 0,
        totalPages: Math.max(1, Math.ceil((totalRow?.count || 0) / pageSize)),
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
