import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getRuntimePaymentSettings } from "@/lib/payment-settings";
import { logError } from "@/lib/logger";

function parsePayload(payload: unknown): Record<string, unknown> {
  if (typeof payload === "object" && payload !== null) {
    return payload as Record<string, unknown>;
  }
  return {};
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let paymentId = "";
  try {
    const session = await requireAuth();
    const { id } = await params;
    paymentId = id;
    const payment = await db.query.payments.findFirst({
      where: and(eq(payments.id, id), eq(payments.userId, session.user.id)),
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const payload = parsePayload(payment.providerPayload);
    const courseSlug = typeof payload.courseSlug === "string" ? payload.courseSlug : null;
    const manualInstructions =
      typeof payload.instructions === "string" ? payload.instructions : null;
    const paymentProofUrl = typeof payload.paymentProofUrl === "string" ? payload.paymentProofUrl : null;
    const paymentProofName = typeof payload.paymentProofName === "string" ? payload.paymentProofName : null;
    const paymentProofNote = typeof payload.paymentProofNote === "string" ? payload.paymentProofNote : null;
    const paymentProofSubmittedAt =
      typeof payload.paymentProofSubmittedAt === "string" ? payload.paymentProofSubmittedAt : null;
    const paymentProofVerifiedAt =
      typeof payload.paymentProofVerifiedAt === "string" ? payload.paymentProofVerifiedAt : null;
    const paymentProofRejectReason =
      typeof payload.paymentProofRejectReason === "string" ? payload.paymentProofRejectReason : null;
    const paymentProofRejectedAt =
      typeof payload.paymentProofRejectedAt === "string" ? payload.paymentProofRejectedAt : null;
    const runtime = await getRuntimePaymentSettings();
    const estimatedVerificationMinutes = payment.provider === "MANUAL" ? runtime.manualEtaHours * 60 : 5;

    return NextResponse.json({
      ...payment,
      itemType: payment.tier === "PREMIUM" ? "PREMIUM_COURSE" : "LIFETIME",
      itemTitle:
        payment.tier === "PREMIUM"
          ? courseSlug
            ? `Premium: ${courseSlug.replace(/-/g, " ")}`
            : "Premium Course Access"
          : "One-time Lifetime Access",
      itemSlug: courseSlug,
      manualInstructions,
      estimatedVerificationMinutes,
      supportContact: runtime.supportContact,
      paymentProofUrl,
      paymentProofName,
      paymentProofNote,
      paymentProofSubmittedAt,
      paymentProofVerifiedAt,
      paymentProofRejectReason,
      paymentProofRejectedAt,
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    logError("payments.detail.failed", error, { paymentId });
    return NextResponse.json({ error: "Failed to load payment detail" }, { status: 500 });
  }
}

