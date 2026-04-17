import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { count, desc, ilike } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import { parsePagination } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const { page, pageSize, offset } = parsePagination(searchParams, { pageSize: 20 });
    const q = String(searchParams.get("q") || "").trim();

    const whereClause = q ? ilike(certificates.certificateNumber, `%${q}%`) : undefined;
    const [totalRow] = await db.select({ count: count() }).from(certificates).where(whereClause);

    const rows = await db.query.certificates.findMany({
      where: whereClause,
      with: {
        user: { columns: { id: true, name: true, email: true } },
        course: { columns: { id: true, title: true, slug: true } },
      },
      orderBy: [desc(certificates.issuedAt)],
      limit: pageSize,
      offset,
    });
    return NextResponse.json({
      items: rows,
      pagination: {
        page,
        pageSize,
        total: totalRow?.count || 0,
        totalPages: Math.max(1, Math.ceil((totalRow?.count || 0) / pageSize)),
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json({ error: "Failed to load certificates" }, { status: 500 });
  }
}

