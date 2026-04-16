import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { createCheckout, getTierAmount } from "@/lib/payment-gateways";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { getRuntimePaymentSettings } from "@/lib/payment-settings";
import crypto from "crypto";

const PAID_TIERS = ["LIFETIME"] as const;

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const tier = String(body.tier || "").toUpperCase();
    if (!PAID_TIERS.includes(tier as (typeof PAID_TIERS)[number])) {
      return NextResponse.json({ error: "Only one-time LIFETIME checkout is supported" }, { status: 400 });
    }

    const amount = getTierAmount(tier);
    if (!amount) {
      return NextResponse.json({ error: "Invalid tier amount" }, { status: 400 });
    }

    const runtimeSettings = await getRuntimePaymentSettings();
    const orderId = `ORD-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    if (runtimeSettings.paymentMode === "MANUAL") {
      const externalId = `MAN-${orderId}`;
      const [payment] = await db
        .insert(payments)
        .values({
          id: crypto.randomUUID(),
          userId: session.user.id,
          provider: "MANUAL",
          tier,
          amount: String(amount),
          status: "PENDING",
          externalId,
          checkoutUrl: null,
          providerPayload: {
            mode: "MANUAL",
            instructions: runtimeSettings.manualInstructions,
          },
        })
        .returning();

      return NextResponse.json({
        paymentId: payment.id,
        externalId: payment.externalId,
        provider: payment.provider,
        mode: "MANUAL",
        manualInstructions: runtimeSettings.manualInstructions,
      });
    }

    const checkout = await createCheckout({
      orderId,
      amount,
      tier,
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
        tier,
        amount: String(amount),
        status: "PENDING",
        externalId: checkout.externalId,
        checkoutUrl: checkout.checkoutUrl,
        providerPayload: checkout.payload,
      })
      .returning();

    return NextResponse.json({
      paymentId: payment.id,
      externalId: payment.externalId,
      checkoutUrl: payment.checkoutUrl,
      provider: payment.provider,
      mode: "GATEWAY",
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json({ error: (error as Error).message || "Failed to create checkout" }, { status: 500 });
  }
}

