import { NextResponse } from "next/server";
import { db } from "@/db";
import { sidebarItems } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(sidebarItems)
      .where(eq(sidebarItems.isActive, true))
      .orderBy(asc(sidebarItems.section), asc(sidebarItems.sortOrder), asc(sidebarItems.createdAt));

    const webinars = rows.filter((item) => item.section === "WEBINAR");
    const premiumVideos = rows.filter((item) => item.section === "PREMIUM_VIDEO");

    return NextResponse.json({ webinars, premiumVideos });
  } catch (error) {
    console.error("Failed to fetch sidebar items:", error);
    return NextResponse.json({ error: "Failed to fetch sidebar items" }, { status: 500 });
  }
}

