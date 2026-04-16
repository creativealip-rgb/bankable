import { and, eq } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@/db";
import { memberships } from "@/db/schema";

const VALID_TIERS = ["FREE", "BASIC", "PREMIUM", "LIFETIME"] as const;
export type MembershipTier = (typeof VALID_TIERS)[number];

export function computeEndDate(tier: MembershipTier) {
  if (tier === "LIFETIME" || tier === "FREE") return null;
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);
  return endDate;
}

export async function activateMembership(userId: string, tier: MembershipTier) {
  if (!VALID_TIERS.includes(tier)) {
    throw new Error(`Invalid membership tier: ${tier}`);
  }

  const now = new Date();
  await db
    .update(memberships)
    .set({ status: "CANCELLED", endDate: now })
    .where(and(eq(memberships.userId, userId), eq(memberships.status, "ACTIVE")));

  const [newMembership] = await db
    .insert(memberships)
    .values({
      id: crypto.randomUUID(),
      userId,
      tier,
      status: "ACTIVE",
      startDate: now,
      endDate: computeEndDate(tier),
    })
    .returning();

  return newMembership;
}

