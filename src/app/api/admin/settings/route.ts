import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/db";
import { paymentSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { writeAdminAudit } from "@/lib/admin-audit";
import { logError } from "@/lib/logger";

const VALID_MODES = ["MANUAL", "GATEWAY"] as const;
const VALID_PROVIDERS = ["MIDTRANS", "XENDIT"] as const;

function isUndefinedColumnError(error: unknown): boolean {
  const directCode = (error as { code?: string } | null)?.code;
  if (directCode === "42703") return true;
  const causeCode = (error as { cause?: { code?: string } } | null)?.cause?.code;
  if (causeCode === "42703") return true;
  const message = String((error as { message?: string } | null)?.message || "").toLowerCase();
  if (message.includes("42703")) return true;
  return message.includes("does not exist") && message.includes("payment_settings");
}

export async function GET() {
  try {
    await requireAdmin();
    let row:
      | {
          paymentMode: string;
          paymentProvider: string;
          manualInstructions: string | null;
          manualEtaHours: number;
          supportContact: string | null;
        }
      | {
          paymentMode: string;
          paymentProvider: string;
          manualInstructions: string | null;
        }
      | undefined;
    try {
      row = await db.query.paymentSettings.findFirst({
        where: eq(paymentSettings.id, "global"),
        columns: {
          paymentMode: true,
          paymentProvider: true,
          manualInstructions: true,
          manualEtaHours: true,
          supportContact: true,
        },
      });
    } catch (error) {
      if (!isUndefinedColumnError(error)) throw error;
      row = await db.query.paymentSettings.findFirst({
        where: eq(paymentSettings.id, "global"),
        columns: {
          paymentMode: true,
          paymentProvider: true,
          manualInstructions: true,
        },
      });
    }
    const manualEtaHours = (row as { manualEtaHours?: number } | undefined)?.manualEtaHours || 24;
    const supportContact = (row as { supportContact?: string | null } | undefined)?.supportContact || "";
    return NextResponse.json({
      paymentMode: row?.paymentMode || "GATEWAY",
      paymentProvider: row?.paymentProvider || process.env.PAYMENT_PROVIDER || "MIDTRANS",
      manualInstructions: row?.manualInstructions || "",
      manualEtaHours,
      supportContact,
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
    const session = await requireAdmin();
    const body = await request.json();
    const paymentMode = String(body.paymentMode || "").toUpperCase();
    const paymentProvider = String(body.paymentProvider || "").toUpperCase();
    const manualInstructions = String(body.manualInstructions || "").trim();
    const manualEtaHours = Number(body.manualEtaHours ?? 24);
    const supportContact = String(body.supportContact || "").trim();

    if (!VALID_MODES.includes(paymentMode as (typeof VALID_MODES)[number])) {
      return NextResponse.json({ error: "Invalid payment mode" }, { status: 400 });
    }
    if (!VALID_PROVIDERS.includes(paymentProvider as (typeof VALID_PROVIDERS)[number])) {
      return NextResponse.json({ error: "Invalid payment provider" }, { status: 400 });
    }
    if (!Number.isFinite(manualEtaHours) || manualEtaHours < 1 || manualEtaHours > 168) {
      return NextResponse.json({ error: "manualEtaHours must be between 1-168" }, { status: 400 });
    }

    try {
      await db
        .insert(paymentSettings)
        .values({
          id: "global",
          paymentMode,
          paymentProvider,
          manualInstructions: manualInstructions || null,
          manualEtaHours: Math.floor(manualEtaHours),
          supportContact: supportContact || null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: paymentSettings.id,
          set: {
            paymentMode,
            paymentProvider,
            manualInstructions: manualInstructions || null,
            manualEtaHours: Math.floor(manualEtaHours),
            supportContact: supportContact || null,
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      if (!isUndefinedColumnError(error)) throw error;
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
    }

    await writeAdminAudit({
      actorUserId: session.user.id,
      action: "ADMIN_SETTINGS_UPDATED",
      entityType: "payment_settings",
      entityId: "global",
      metadata: {
        paymentMode,
        paymentProvider,
        manualEtaHours: Math.floor(manualEtaHours),
        supportContact: supportContact || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) throw error;
    logError("admin.settings.update.failed", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

