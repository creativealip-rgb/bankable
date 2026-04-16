import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-helpers";
import { activateMembership } from "@/lib/membership";
import { grantPaidCourseAccess, paymentHasCourseSlug, readCourseSlug } from "@/lib/course-access";
import { eq } from "drizzle-orm";

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
      const payload =
        typeof payment.providerPayload === "object" && payment.providerPayload !== null
          ? payment.providerPayload as Record<string, unknown>
          : {};
      await db
        .update(payments)
        .set({
          status: "PAID",
          paidAt: new Date(),
          updatedAt: new Date(),
          providerPayload: {
            ...payload,
            manualApprovedBy: session.user.id,
            manualApprovedAt: new Date().toISOString(),
          },
        })
        .where(eq(payments.id, payment.id));

      const courseSlug = readCourseSlug(payment.providerPayload);
      if (courseSlug) {
        await grantPaidCourseAccess(payment.userId, courseSlug, payment.id);
      } else if (!paymentHasCourseSlug(payment.providerPayload)) {
        await activateMembership(payment.userId, payment.tier as "FREE" | "BASIC" | "PREMIUM" | "LIFETIME");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json({ error: "Failed to mark payment as paid" }, { status: 500 });
  }
}

