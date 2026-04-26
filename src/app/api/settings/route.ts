import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";

// GET /api/settings?key=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }

    const setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, key),
    });

    return NextResponse.json(setting || { key, value: null });
  } catch (error) {
    console.error("Failed to fetch setting:", error);
    return NextResponse.json({ error: "Failed to fetch setting" }, { status: 500 });
  }
}

// POST /api/settings (Admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }

    await db.insert(systemSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, updatedAt: new Date() },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to update setting:", error);
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
