import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/db";
import { paymentSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const VALID_MODES = ["MANUAL", "GATEWAY"] as const;
const VALID_PROVIDERS = ["MIDTRANS", "XENDIT"] as const;

export async function GET() {
  try {
    await requireAdmin();
    const row = await db.query.paymentSettings.findFirst({
      where: eq(paymentSettings.id, "global"),
      columns: {
        paymentMode: true,
        paymentProvider: true,
        manualInstructions: true,
      },
    });
    return NextResponse.json({
      paymentMode: row?.paymentMode || "GATEWAY",
      paymentProvider: row?.paymentProvider || process.env.PAYMENT_PROVIDER || "MIDTRANS",
      manualInstructions: row?.manualInstructions || "",
      hasMidtransKey: Boolean(process.env.MIDTRANS_SERVER_KEY),
      hasXenditKey: Boolean(process.env.XENDIT_SECRET_KEY),
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      webhooks: {
        payments: "/api/payments/webhook",
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const paymentMode = String(body.paymentMode || "").toUpperCase();
    const paymentProvider = String(body.paymentProvider || "").toUpperCase();
    const manualInstructions = String(body.manualInstructions || "").trim();

    if (!VALID_MODES.includes(paymentMode as (typeof VALID_MODES)[number])) {
      return NextResponse.json({ error: "Invalid payment mode" }, { status: 400 });
    }
    if (!VALID_PROVIDERS.includes(paymentProvider as (typeof VALID_PROVIDERS)[number])) {
      return NextResponse.json({ error: "Invalid payment provider" }, { status: 400 });
    }

    await db
      .insert(paymentSettings)
      .values({
        id: "global",
        paymentMode,
        paymentProvider,
        manualInstructions: manualInstructions || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: paymentSettings.id,
        set: {
          paymentMode,
          paymentProvider,
          manualInstructions: manualInstructions || null,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

