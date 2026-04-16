import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, premiumCourseAccess } from "@/db/schema";
import crypto from "crypto";

export function readCourseSlug(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const maybeSlug = (payload as Record<string, unknown>).courseSlug;
  return typeof maybeSlug === "string" && maybeSlug.trim() ? maybeSlug : null;
}

export function paymentHasCourseSlug(payload: unknown): boolean {
  return Boolean(readCourseSlug(payload));
}

export async function grantPaidCourseAccess(userId: string, courseSlug: string, paymentId?: string | null) {
  await db
    .insert(premiumCourseAccess)
    .values({
      id: crypto.randomUUID(),
      userId,
      courseSlug,
      sourcePaymentId: paymentId || null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [premiumCourseAccess.userId, premiumCourseAccess.courseSlug],
      set: {
        sourcePaymentId: paymentId || null,
        updatedAt: new Date(),
      },
    });
}

export async function hasPaidCourseAccess(userId: string, courseSlug: string): Promise<boolean> {
  const entitlement = await db.query.premiumCourseAccess.findFirst({
    where: and(eq(premiumCourseAccess.userId, userId), eq(premiumCourseAccess.courseSlug, courseSlug)),
    columns: { id: true },
  });
  if (entitlement) return true;

  // Fallback for historical paid records before entitlement table existed.
  const rows = await db.query.payments.findMany({
    where: and(
      eq(payments.userId, userId),
      eq(payments.status, "PAID"),
      eq(payments.tier, "PREMIUM")
    ),
    columns: {
      providerPayload: true,
    },
  });

  const hasLegacyAccess = rows.some((row) => readCourseSlug(row.providerPayload) === courseSlug);
  if (hasLegacyAccess) {
    await grantPaidCourseAccess(userId, courseSlug, null);
    return true;
  }
  return false;
}

