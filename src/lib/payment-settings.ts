import { db } from "@/db";
import { paymentSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export type PaymentMode = "MANUAL" | "GATEWAY";
export type PaymentProvider = "MIDTRANS" | "XENDIT";

export type RuntimePaymentSettings = {
  paymentMode: PaymentMode;
  paymentProvider: PaymentProvider;
  manualInstructions: string;
};

function normalizeMode(value: string | null | undefined): PaymentMode {
  return String(value || "").toUpperCase() === "MANUAL" ? "MANUAL" : "GATEWAY";
}

function normalizeProvider(value: string | null | undefined): PaymentProvider {
  return String(value || "").toUpperCase() === "XENDIT" ? "XENDIT" : "MIDTRANS";
}

export async function getRuntimePaymentSettings(): Promise<RuntimePaymentSettings> {
  const row = await db.query.paymentSettings.findFirst({
    where: eq(paymentSettings.id, "global"),
    columns: {
      paymentMode: true,
      paymentProvider: true,
      manualInstructions: true,
    },
  });

  const envProvider = normalizeProvider(process.env.PAYMENT_PROVIDER);
  const paymentMode = normalizeMode(row?.paymentMode || "GATEWAY");
  const paymentProvider = normalizeProvider(row?.paymentProvider || envProvider);
  const manualInstructions =
    row?.manualInstructions?.trim() ||
    "Silakan transfer manual lalu kirim bukti pembayaran ke admin. Akses akan diaktifkan setelah verifikasi.";

  return {
    paymentMode,
    paymentProvider,
    manualInstructions,
  };
}

