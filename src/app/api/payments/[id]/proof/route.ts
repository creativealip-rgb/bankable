import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

const MAX_PROOF_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function parsePayload(payload: unknown): Record<string, unknown> {
  if (typeof payload === "object" && payload !== null) {
    return payload as Record<string, unknown>;
  }
  return {};
}

function fileExtensionFromName(fileName: string, mimeType: string) {
  const extFromName = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".")).toLowerCase() : "";
  if (/^\.[a-z0-9]{1,8}$/.test(extFromName)) return extFromName;
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "application/pdf") return ".pdf";
  return ".bin";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = enforceRateLimit(request, { namespace: "payments:upload-proof", limit: 20, windowMs: 60_000 });
  if (limited) return limited;

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
    if (payment.status !== "PENDING") {
      return NextResponse.json({ error: "Proof can only be uploaded for pending payments" }, { status: 400 });
    }
    if (payment.provider !== "MANUAL") {
      return NextResponse.json({ error: "Payment proof upload is only available for manual payments" }, { status: 400 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const note = String(form.get("note") || "").trim();
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Proof file is required" }, { status: 400 });
    }
    if (note.length > 500) {
      return NextResponse.json({ error: "Note is too long (max 500 chars)" }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_PROOF_SIZE_BYTES) {
      return NextResponse.json({ error: "Invalid file size. Max 8MB." }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, WEBP, or PDF files are allowed" }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), "public", "uploads", "payment-proofs");
    await mkdir(uploadDir, { recursive: true });
    const ext = fileExtensionFromName(file.name, file.type);
    const safeName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;
    const bytes = await file.arrayBuffer();
    await writeFile(join(uploadDir, safeName), Buffer.from(bytes));
    const proofUrl = `/uploads/payment-proofs/${safeName}`;

    const payload = parsePayload(payment.providerPayload);
    const submittedAt = new Date().toISOString();
    const [updated] = await db
      .update(payments)
      .set({
        providerPayload: {
          ...payload,
          paymentProofUrl: proofUrl,
          paymentProofName: file.name,
          paymentProofSize: file.size,
          paymentProofMimeType: file.type,
          paymentProofNote: note || null,
          paymentProofSubmittedAt: submittedAt,
          paymentProofVerifiedAt: null,
          paymentProofVerifiedBy: null,
          paymentProofRejectedAt: null,
          paymentProofRejectedBy: null,
          paymentProofRejectReason: null,
        },
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id))
      .returning({
        id: payments.id,
        providerPayload: payments.providerPayload,
      });

    return NextResponse.json({
      paymentId: updated.id,
      paymentProofUrl: proofUrl,
      paymentProofSubmittedAt: submittedAt,
      paymentProofNote: note || null,
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    logError("payments.upload_proof.failed", error, { paymentId });
    return NextResponse.json({ error: "Failed to upload payment proof" }, { status: 500 });
  }
}

