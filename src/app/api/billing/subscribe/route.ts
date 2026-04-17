import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { memberships, payments } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";
import { activateMembership, type MembershipTier } from "@/lib/membership";
import { createCheckout, getTierAmount } from "@/lib/payment-gateways";
import { getRuntimePaymentSettings } from "@/lib/payment-settings";
import crypto from "crypto";
import { logError } from "@/lib/logger";

const VALID_TIERS = ["FREE", "BASIC", "PREMIUM", "LIFETIME"] as const;

// POST /api/billing/subscribe — membership change (FREE direct, LIFETIME via payment checkout)
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

    if (requestedTier === "FREE") {
      const newMembership = await activateMembership(userId, requestedTier);
      return NextResponse.json({ membership: newMembership }, { status: 201 });
    }

    if (requestedTier !== "LIFETIME") {
      return NextResponse.json(
        { error: "Self-serve checkout currently supports FREE and LIFETIME only" },
        { status: 400 }
      );
    }

    const amount = getTierAmount(requestedTier);
    if (!amount) {
      return NextResponse.json({ error: "Invalid tier amount" }, { status: 400 });
    }

    const runtimeSettings = await getRuntimePaymentSettings();
    const orderId = `BILL-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    if (runtimeSettings.paymentMode === "MANUAL") {
      const externalId = `MAN-${orderId}`;
      const [payment] = await db
        .insert(payments)
        .values({
          id: crypto.randomUUID(),
          userId: session.user.id,
          provider: "MANUAL",
          tier: requestedTier,
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

      return NextResponse.json(
        {
          paymentId: payment.id,
          externalId: payment.externalId,
          provider: payment.provider,
          mode: "MANUAL",
          manualInstructions: runtimeSettings.manualInstructions,
        },
        { status: 201 }
      );
    }

    const checkout = await createCheckout({
      orderId,
      amount,
      tier: requestedTier,
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
        tier: requestedTier,
        amount: String(amount),
        status: "PENDING",
        externalId: checkout.externalId,
        checkoutUrl: checkout.checkoutUrl,
        providerPayload: checkout.payload,
      })
      .returning();

    return NextResponse.json(
      {
        paymentId: payment.id,
        externalId: payment.externalId,
        checkoutUrl: payment.checkoutUrl,
        provider: payment.provider,
        mode: "GATEWAY",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Response) throw error;
    logError("billing.subscribe.failed", error);
    return NextResponse.json({ error: "Failed to change membership" }, { status: 500 });
  }
}
