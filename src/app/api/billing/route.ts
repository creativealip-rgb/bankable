import { NextResponse } from "next/server";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";
import crypto from "crypto";

// GET /api/billing — Current membership and membership history for current user
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const history = await db.query.memberships.findMany({
      where: eq(memberships.userId, userId),
      orderBy: [desc(memberships.createdAt)],
    });

    const currentMembership =
      history.find((m) => m.status === "ACTIVE") ?? history[0] ?? null;

    return NextResponse.json({
      currentMembership,
      history,
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to fetch billing data:", error);
    return NextResponse.json({ error: "Failed to fetch billing data" }, { status: 500 });
  }
}

// DELETE /api/billing — Cancel active membership and fallback to FREE tier
export async function DELETE() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const now = new Date();

    await db
      .update(memberships)
      .set({ status: "CANCELLED", endDate: now })
      .where(and(eq(memberships.userId, userId), eq(memberships.status, "ACTIVE")));

    const [freeMembership] = await db
      .insert(memberships)
      .values({
        id: crypto.randomUUID(),
        userId,
        tier: "FREE",
        status: "ACTIVE",
        startDate: now,
        endDate: null,
      })
      .returning();

    return NextResponse.json({ success: true, membership: freeMembership });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to cancel membership:", error);
    return NextResponse.json({ error: "Failed to cancel membership" }, { status: 500 });
  }
}
