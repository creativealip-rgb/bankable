import { db } from "@/db";
import { paymentSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logError } from "@/lib/logger";

export type PaymentMode = "MANUAL" | "GATEWAY";
export type PaymentProvider = "MIDTRANS" | "XENDIT";

export type RuntimePaymentSettings = {
  paymentMode: PaymentMode;
  paymentProvider: PaymentProvider;
  manualInstructions: string;
  manualEtaHours: number;
  supportContact: string;
};

function normalizeMode(value: string | null | undefined): PaymentMode {
  return String(value || "").toUpperCase() === "MANUAL" ? "MANUAL" : "GATEWAY";
}

function normalizeProvider(value: string | null | undefined): PaymentProvider {
  return String(value || "").toUpperCase() === "XENDIT" ? "XENDIT" : "MIDTRANS";
}

function isUndefinedColumnError(error: unknown): boolean {
  const directCode = (error as { code?: string } | null)?.code;
  if (directCode === "42703") return true;
  const causeCode = (error as { cause?: { code?: string } } | null)?.cause?.code;
  if (causeCode === "42703") return true;
  const message = String((error as { message?: string } | null)?.message || "").toLowerCase();
  if (message.includes("42703")) return true;
  return message.includes("does not exist") && message.includes("payment_settings");
}

export async function getRuntimePaymentSettings(): Promise<RuntimePaymentSettings> {
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
    if (!isUndefinedColumnError(error)) {
      throw error;
    }
    logError("payment_settings.compat_fallback", error);
    row = await db.query.paymentSettings.findFirst({
      where: eq(paymentSettings.id, "global"),
      columns: {
        paymentMode: true,
        paymentProvider: true,
        manualInstructions: true,
      },
    });
  }

  const envProvider = normalizeProvider(process.env.PAYMENT_PROVIDER);
  const paymentMode = normalizeMode(row?.paymentMode || "GATEWAY");
  const paymentProvider = normalizeProvider(row?.paymentProvider || envProvider);
  const manualInstructions =
    row?.manualInstructions?.trim() ||
    "Silakan transfer manual lalu kirim bukti pembayaran ke admin. Akses akan diaktifkan setelah verifikasi.";
  const etaValue = (row as { manualEtaHours?: number } | undefined)?.manualEtaHours;
  const supportValue = (row as { supportContact?: string | null } | undefined)?.supportContact;
  const manualEtaHours = Number.isFinite(Number(etaValue)) ? Math.max(1, Number(etaValue)) : 24;
  const supportContact = supportValue?.trim() || "Admin support";

  return {
    paymentMode,
    paymentProvider,
    manualInstructions,
    manualEtaHours,
    supportContact,
  };
}

