import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { and, eq } from "drizzle-orm";

function parsePayload(payload: unknown): Record<string, unknown> {
  if (typeof payload === "object" && payload !== null) {
    return payload as Record<string, unknown>;
  }
  return {};
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const payment = await db.query.payments.findFirst({
      where: and(eq(payments.id, id), eq(payments.userId, session.user.id)),
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const payload = parsePayload(payment.providerPayload);
    const courseSlug = typeof payload.courseSlug === "string" ? payload.courseSlug : null;
    const manualInstructions =
      typeof payload.instructions === "string" ? payload.instructions : null;

    return NextResponse.json({
      ...payment,
      itemType: payment.tier === "PREMIUM" ? "PREMIUM_COURSE" : "LIFETIME",
      itemTitle:
        payment.tier === "PREMIUM"
          ? courseSlug
            ? `Premium: ${courseSlug.replace(/-/g, " ")}`
            : "Premium Course Access"
          : "One-time Lifetime Access",
      itemSlug: courseSlug,
      manualInstructions,
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json({ error: "Failed to load payment detail" }, { status: 500 });
  }
}

