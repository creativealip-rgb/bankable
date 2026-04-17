import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

function parsePayload(payload: unknown): Record<string, unknown> {
  if (typeof payload === "object" && payload !== null) {
    return payload as Record<string, unknown>;
  }
  return {};
}

function inferItemInfo(tier: string, payload: unknown) {
  const info = parsePayload(payload);
  const paymentProofUrl = typeof info.paymentProofUrl === "string" ? info.paymentProofUrl : null;
  const paymentProofSubmittedAt =
    typeof info.paymentProofSubmittedAt === "string" ? info.paymentProofSubmittedAt : null;
  if (tier === "PREMIUM") {
    const slug = typeof info.courseSlug === "string" ? info.courseSlug : null;
    return {
      itemType: "PREMIUM_COURSE",
      itemTitle: slug ? `Premium: ${slug.replace(/-/g, " ")}` : "Premium Course Access",
      itemSlug: slug,
      paymentProofUrl,
      paymentProofSubmittedAt,
    };
  }
  return {
    itemType: "LIFETIME",
    itemTitle: "One-time Lifetime Access",
    itemSlug: null,
    paymentProofUrl,
    paymentProofSubmittedAt,
  };
}

export async function GET() {
  try {
    const session = await requireAuth();
    const rows = await db.query.payments.findMany({
      where: eq(payments.userId, session.user.id),
      orderBy: [desc(payments.createdAt)],
      limit: 100,
    });

    return NextResponse.json(
      rows.map((row) => ({
        ...row,
        ...inferItemInfo(row.tier, row.providerPayload),
      }))
    );
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json({ error: "Failed to load payments" }, { status: 500 });
  }
}

