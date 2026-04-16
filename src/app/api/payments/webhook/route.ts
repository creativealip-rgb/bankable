import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { verifyMidtransSignature } from "@/lib/payment-gateways";
import { activateMembership } from "@/lib/membership";
import { getRuntimePaymentSettings } from "@/lib/payment-settings";
import { grantPaidCourseAccess, paymentHasCourseSlug, readCourseSlug } from "@/lib/course-access";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const runtimeSettings = await getRuntimePaymentSettings();
  const headerToken = request.headers.get("x-callback-token");
  const provider =
    headerToken ? "XENDIT" : body?.signature_key ? "MIDTRANS" : runtimeSettings.paymentProvider;

  try {
    if (provider === "MIDTRANS") {
      if (!verifyMidtransSignature(body)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
      const externalId = String(body.order_id || "");
      const transactionStatus = String(body.transaction_status || "").toLowerCase();
      const paid = transactionStatus === "settlement" || transactionStatus === "capture";

      const payment = await db.query.payments.findFirst({
        where: eq(payments.externalId, externalId),
      });
      if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      const existingPayload =
        typeof payment.providerPayload === "object" && payment.providerPayload !== null
          ? payment.providerPayload as Record<string, unknown>
          : {};

      await db
        .update(payments)
        .set({
          status: paid ? "PAID" : "FAILED",
          paidAt: paid ? new Date() : null,
          updatedAt: new Date(),
          providerPayload: {
            ...existingPayload,
            webhookPayload: body,
          },
        })
        .where(eq(payments.id, payment.id));

      if (paid) {
        const courseSlug = readCourseSlug(payment.providerPayload);
        if (courseSlug) {
          await grantPaidCourseAccess(payment.userId, courseSlug, payment.id);
        } else if (!paymentHasCourseSlug(payment.providerPayload)) {
          await activateMembership(payment.userId, payment.tier as "BASIC" | "PREMIUM" | "LIFETIME" | "FREE");
        }
      }
      return NextResponse.json({ success: true });
    }

    // Xendit webhook
    const callbackToken = headerToken;
    if (callbackToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: "Invalid callback token" }, { status: 401 });
    }

    const externalId = String(body.external_id || "");
    const status = String(body.status || "").toUpperCase();
    const paid = status === "PAID";
    const payment = await db.query.payments.findFirst({
      where: and(eq(payments.externalId, externalId), eq(payments.provider, "XENDIT")),
    });
    if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    const existingPayload =
      typeof payment.providerPayload === "object" && payment.providerPayload !== null
        ? payment.providerPayload as Record<string, unknown>
        : {};

    await db
      .update(payments)
      .set({
        status: paid ? "PAID" : status === "EXPIRED" ? "EXPIRED" : "FAILED",
        paidAt: paid ? new Date() : null,
        updatedAt: new Date(),
        providerPayload: {
          ...existingPayload,
          webhookPayload: body,
        },
      })
      .where(eq(payments.id, payment.id));

    if (paid) {
      const courseSlug = readCourseSlug(payment.providerPayload);
      if (courseSlug) {
        await grantPaidCourseAccess(payment.userId, courseSlug, payment.id);
      } else if (!paymentHasCourseSlug(payment.providerPayload)) {
        await activateMembership(payment.userId, payment.tier as "BASIC" | "PREMIUM" | "LIFETIME" | "FREE");
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Webhook failed" }, { status: 500 });
  }
}

