import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc, ilike } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";

// GET /api/admin/users — List all users with stats
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const allUsers = await db.query.users.findMany({
      where: search ? ilike(users.name, `%${search}%`) : undefined,
      orderBy: [desc(users.createdAt)],
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

    return NextResponse.json(enriched);
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
