import { NextResponse } from "next/server";
import { db } from "@/db";
import { memberships, payments, premiumCourseAccess } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-helpers";
import { computeEndDate } from "@/lib/membership";
import { paymentHasCourseSlug, readCourseSlug } from "@/lib/course-access";
import { and, eq } from "drizzle-orm";
import crypto from "crypto";
import { writeAdminAudit } from "@/lib/admin-audit";
import { logError, logInfo } from "@/lib/logger";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, id),
    });
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status !== "PAID") {
      await db.transaction(async (tx) => {
        const payload =
          typeof payment.providerPayload === "object" && payment.providerPayload !== null
            ? payment.providerPayload as Record<string, unknown>
            : {};
        if (payment.provider === "MANUAL" && typeof payload.paymentProofUrl !== "string") {
          throw new Error("Payment proof is required before manual verification");
        }

        const now = new Date();
        await tx
          .update(payments)
          .set({
            status: "PAID",
            paidAt: now,
            updatedAt: now,
            providerPayload: {
              ...payload,
              manualApprovedBy: session.user.id,
              manualApprovedAt: now.toISOString(),
              paymentProofVerifiedBy: session.user.id,
              paymentProofVerifiedAt: now.toISOString(),
              paymentProofRejectedBy: null,
              paymentProofRejectedAt: null,
              paymentProofRejectReason: null,
            },
          })
          .where(eq(payments.id, payment.id));

        const courseSlug = readCourseSlug(payment.providerPayload);
        if (courseSlug) {
          await tx
            .insert(premiumCourseAccess)
            .values({
              id: crypto.randomUUID(),
              userId: payment.userId,
              courseSlug,
              sourcePaymentId: payment.id,
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [premiumCourseAccess.userId, premiumCourseAccess.courseSlug],
              set: { sourcePaymentId: payment.id, updatedAt: new Date() },
            });
        } else if (!paymentHasCourseSlug(payment.providerPayload)) {
          const now = new Date();
          await tx
            .update(memberships)
            .set({ status: "CANCELLED", endDate: now })
            .where(and(eq(memberships.userId, payment.userId), eq(memberships.status, "ACTIVE")));
          await tx.insert(memberships).values({
            id: crypto.randomUUID(),
            userId: payment.userId,
            tier: payment.tier,
            status: "ACTIVE",
            startDate: now,
            endDate: computeEndDate(payment.tier as "FREE" | "BASIC" | "PREMIUM" | "LIFETIME"),
          });
        }
      });

      await writeAdminAudit({
        actorUserId: session.user.id,
        action: "ADMIN_PAYMENT_MARK_PAID",
        entityType: "payment",
        entityId: payment.id,
        metadata: {
          provider: payment.provider,
          externalId: payment.externalId,
          tier: payment.tier,
          userId: payment.userId,
        },
      });
      logInfo("admin.payment.mark_paid", { paymentId: payment.id, actorUserId: session.user.id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Payment proof is required before manual verification") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Response) throw error;
    logError("admin.payment.mark_paid.failed", error);
    return NextResponse.json({ error: "Failed to mark payment as paid" }, { status: 500 });
  }
}

