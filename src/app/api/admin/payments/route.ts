import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import { parsePagination } from "@/lib/pagination";

function parsePayload(payload: unknown): Record<string, unknown> {
  if (typeof payload === "object" && payload !== null) {
    return payload as Record<string, unknown>;
  }
  return {};
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const { page, pageSize, offset } = parsePagination(searchParams, { pageSize: 20 });
    const status = String(searchParams.get("status") || "").trim().toUpperCase();
    const provider = String(searchParams.get("provider") || "").trim().toUpperCase();
    const q = String(searchParams.get("q") || "").trim();

    const whereClause = and(
      status ? eq(payments.status, status) : undefined,
      provider ? eq(payments.provider, provider) : undefined,
      q ? ilike(payments.externalId, `%${q}%`) : undefined
    );

    const [totalRow] = await db.select({ count: count() }).from(payments).where(whereClause);
    const rows = await db.query.payments.findMany({
      where: whereClause,
      with: {
        user: { columns: { id: true, name: true, email: true } },
      },
      orderBy: [desc(payments.createdAt)],
      limit: pageSize,
      offset,
    });
    const items = rows.map((row) => {
      const payload = parsePayload(row.providerPayload);
      return {
        ...row,
        paymentProofUrl: typeof payload.paymentProofUrl === "string" ? payload.paymentProofUrl : null,
        paymentProofName: typeof payload.paymentProofName === "string" ? payload.paymentProofName : null,
        paymentProofNote: typeof payload.paymentProofNote === "string" ? payload.paymentProofNote : null,
        paymentProofSubmittedAt:
          typeof payload.paymentProofSubmittedAt === "string" ? payload.paymentProofSubmittedAt : null,
        paymentProofVerifiedAt:
          typeof payload.paymentProofVerifiedAt === "string" ? payload.paymentProofVerifiedAt : null,
      };
    });

    return NextResponse.json({
      items,
      pagination: {
        page,
        pageSize,
        total: totalRow?.count || 0,
        totalPages: Math.max(1, Math.ceil((totalRow?.count || 0) / pageSize)),
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json({ error: "Failed to load payments" }, { status: 500 });
  }
}

