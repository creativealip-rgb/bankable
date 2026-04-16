import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { createCheckout } from "@/lib/payment-gateways";
import { db } from "@/db";
import { courses, payments } from "@/db/schema";
import { getRuntimePaymentSettings } from "@/lib/payment-settings";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const courseSlug = String(body.courseSlug || "");

    if (!courseSlug) {
      return NextResponse.json({ error: "courseSlug is required" }, { status: 400 });
    }

    const course = await db.query.courses.findFirst({
      where: eq(courses.slug, courseSlug),
      columns: { id: true, title: true, price: true },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const amount = Number(course.price || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Course is not a paid premium item" }, { status: 400 });
    }

    const runtimeSettings = await getRuntimePaymentSettings();
    const orderId = `PRM-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    if (runtimeSettings.paymentMode === "MANUAL") {
      const externalId = `MAN-${orderId}`;
      const [payment] = await db
        .insert(payments)
        .values({
          id: crypto.randomUUID(),
          userId: session.user.id,
          provider: "MANUAL",
          tier: "PREMIUM",
          amount: String(amount),
          status: "PENDING",
          externalId,
          checkoutUrl: null,
          providerPayload: {
            mode: "MANUAL",
            instructions: runtimeSettings.manualInstructions,
            courseId: course.id,
            courseSlug,
          },
        })
        .returning();

      return NextResponse.json({
        paymentId: payment.id,
        provider: payment.provider,
        externalId: payment.externalId,
        mode: "MANUAL",
        manualInstructions: runtimeSettings.manualInstructions,
      });
    }

    const checkout = await createCheckout({
      orderId,
      amount,
      tier: "PREMIUM",
      provider: runtimeSettings.paymentProvider,
      customerName: session.user.name || "Member",
      customerEmail: session.user.email,
    });

    const [payment] = await db
      .insert(payments)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        provider: checkout.provider,
        tier: "PREMIUM",
        amount: String(amount),
        status: "PENDING",
        externalId: checkout.externalId,
        checkoutUrl: checkout.checkoutUrl,
        providerPayload: {
          ...((typeof checkout.payload === "object" && checkout.payload !== null) ? checkout.payload as Record<string, unknown> : {}),
          courseId: course.id,
          courseSlug,
        },
      })
      .returning();

    return NextResponse.json({
      paymentId: payment.id,
      checkoutUrl: payment.checkoutUrl,
      provider: payment.provider,
      mode: "GATEWAY",
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json({ error: (error as Error).message || "Failed to create premium checkout" }, { status: 500 });
  }
}

