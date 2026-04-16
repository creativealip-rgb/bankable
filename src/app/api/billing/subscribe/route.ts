import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";
import { activateMembership, type MembershipTier } from "@/lib/membership";

const VALID_TIERS = ["FREE", "BASIC", "PREMIUM", "LIFETIME"] as const;

// POST /api/billing/subscribe — simulate membership upgrade/downgrade
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const body = await request.json();
    const requestedTier = String(body.tier || "").toUpperCase() as MembershipTier;

    if (!VALID_TIERS.includes(requestedTier)) {
      return NextResponse.json({ error: "Invalid membership tier" }, { status: 400 });
    }

    const activeMembership = await db.query.memberships.findFirst({
      where: and(eq(memberships.userId, userId), eq(memberships.status, "ACTIVE")),
    });

    if (activeMembership?.tier === requestedTier) {
      return NextResponse.json({ membership: activeMembership, unchanged: true });
    }

    const newMembership = await activateMembership(userId, requestedTier);

    return NextResponse.json({ membership: newMembership }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to change membership:", error);
    return NextResponse.json({ error: "Failed to change membership" }, { status: 500 });
  }
}
