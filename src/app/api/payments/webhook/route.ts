import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, payments, premiumCourseAccess } from "@/db/schema";
import { verifyMidtransSignature } from "@/lib/payment-gateways";
import { computeEndDate } from "@/lib/membership";
import { getRuntimePaymentSettings } from "@/lib/payment-settings";
import { paymentHasCourseSlug, readCourseSlug } from "@/lib/course-access";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logError, logInfo } from "@/lib/logger";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, { namespace: "payments:webhook", limit: 240, windowMs: 60_000 });
  if (limited) return limited;

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

      await db.transaction(async (tx) => {
        const payment = await tx.query.payments.findFirst({
          where: eq(payments.externalId, externalId),
        });
        if (!payment) throw new Error("Payment not found");
        const existingPayload =
          typeof payment.providerPayload === "object" && payment.providerPayload !== null
            ? payment.providerPayload as Record<string, unknown>
            : {};

        await tx
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

        if (paid && payment.status !== "PAID") {
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
                set: {
                  sourcePaymentId: payment.id,
                  updatedAt: new Date(),
                },
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
        }
      });
      logInfo("payments.webhook.midtrans.processed", { externalId, paid });
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
    await db.transaction(async (tx) => {
      const payment = await tx.query.payments.findFirst({
        where: and(eq(payments.externalId, externalId), eq(payments.provider, "XENDIT")),
      });
      if (!payment) throw new Error("Payment not found");
      const existingPayload =
        typeof payment.providerPayload === "object" && payment.providerPayload !== null
          ? payment.providerPayload as Record<string, unknown>
          : {};

      await tx
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

      if (paid && payment.status !== "PAID") {
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
              set: {
                sourcePaymentId: payment.id,
                updatedAt: new Date(),
              },
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
      }
    });
    logInfo("payments.webhook.xendit.processed", { externalId, status, paid });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Payment not found") {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    logError("payments.webhook.failed", error, { provider });
    return NextResponse.json({ error: (error as Error).message || "Webhook failed" }, { status: 500 });
  }
}

