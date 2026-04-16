import { NextResponse } from "next/server";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await db.query.certificates.findMany({
      with: {
        user: { columns: { id: true, name: true, email: true } },
        course: { columns: { id: true, title: true, slug: true } },
      },
      orderBy: [desc(certificates.issuedAt)],
      limit: 100,
    });
    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json({ error: "Failed to load certificates" }, { status: 500 });
  }
}

