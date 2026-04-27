import { NextResponse } from "next/server";
import { db } from "@/db";
import { adminAuditLogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requireAdmin();

    const logs = await db.query.adminAuditLogs.findMany({
      orderBy: [desc(adminAuditLogs.createdAt)],
      with: {
        actor: {
          columns: { name: true, email: true }
        }
      },
      limit: 100,
    });

    return NextResponse.json(logs);
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to fetch audit logs:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
