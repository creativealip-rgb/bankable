import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sidebarItems } from "@/db/schema";
import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import crypto from "crypto";
import { ensureSidebarDetailHref } from "@/lib/sidebar-content";

export async function GET() {
  try {
    await requireAdmin();
    const items = await db
      .select()
      .from(sidebarItems)
      .orderBy(asc(sidebarItems.section), asc(sidebarItems.sortOrder), asc(sidebarItems.createdAt));

    return NextResponse.json(items);
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to fetch admin sidebar items:", error);
    return NextResponse.json({ error: "Failed to fetch sidebar items" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();

    const section: "WEBINAR" | "PREMIUM_VIDEO" =
      body.section === "PREMIUM_VIDEO" ? "PREMIUM_VIDEO" : "WEBINAR";
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const rawHref = typeof body.href === "string" ? body.href.trim() : "";
    const href =
      rawHref &&
      rawHref !== "/register" &&
      rawHref !== "/courses" &&
      !rawHref.startsWith("/courses?interest=")
        ? rawHref
        : await ensureSidebarDetailHref(title, section, session.user.id);

    const [created] = await db
      .insert(sidebarItems)
      .values({
        id: crypto.randomUUID(),
        section,
        title,
        subtitle: typeof body.subtitle === "string" ? body.subtitle.trim() || null : null,
        dateLabel: typeof body.dateLabel === "string" ? body.dateLabel.trim() || null : null,
        ctaLabel: typeof body.ctaLabel === "string" ? body.ctaLabel.trim() || null : null,
        href,
        priceLabel: typeof body.priceLabel === "string" ? body.priceLabel.trim() || null : null,
        sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
        isActive: body.isActive !== false,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to create sidebar item:", error);
    return NextResponse.json({ error: "Failed to create sidebar item" }, { status: 500 });
  }
}

