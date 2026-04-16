import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sidebarItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import { ensureSidebarDetailHref } from "@/lib/sidebar-content";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const session = await requireAdmin();
    const body = await request.json();

    const existing = await db.query.sidebarItems.findFirst({
      where: eq(sidebarItems.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Sidebar item not found" }, { status: 404 });
    }

    const nextSection: "WEBINAR" | "PREMIUM_VIDEO" =
      typeof body.section === "string"
        ? body.section === "PREMIUM_VIDEO"
          ? "PREMIUM_VIDEO"
          : "WEBINAR"
        : existing.section === "PREMIUM_VIDEO"
          ? "PREMIUM_VIDEO"
          : "WEBINAR";
    const nextTitle =
      typeof body.title === "string" ? body.title.trim() : existing.title;
    const rawHref = typeof body.href === "string" ? body.href.trim() : existing.href || "";
    const href =
      rawHref &&
      rawHref !== "/register" &&
      rawHref !== "/courses" &&
      !rawHref.startsWith("/courses?interest=")
        ? rawHref
        : await ensureSidebarDetailHref(nextTitle, nextSection, session.user.id);

    const [updated] = await db
      .update(sidebarItems)
      .set({
        ...(typeof body.section === "string" && { section: nextSection }),
        ...(typeof body.title === "string" && { title: nextTitle }),
        ...(typeof body.subtitle === "string" && { subtitle: body.subtitle.trim() || null }),
        ...(typeof body.dateLabel === "string" && { dateLabel: body.dateLabel.trim() || null }),
        ...(typeof body.ctaLabel === "string" && { ctaLabel: body.ctaLabel.trim() || null }),
        href,
        ...(typeof body.priceLabel === "string" && { priceLabel: body.priceLabel.trim() || null }),
        ...(typeof body.sortOrder === "number" && { sortOrder: body.sortOrder }),
        ...(typeof body.isActive === "boolean" && { isActive: body.isActive }),
        updatedAt: new Date(),
      })
      .where(eq(sidebarItems.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to update sidebar item:", error);
    return NextResponse.json({ error: "Failed to update sidebar item" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    await requireAdmin();

    const existing = await db.query.sidebarItems.findFirst({
      where: eq(sidebarItems.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Sidebar item not found" }, { status: 404 });
    }

    await db.delete(sidebarItems).where(eq(sidebarItems.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to delete sidebar item:", error);
    return NextResponse.json({ error: "Failed to delete sidebar item" }, { status: 500 });
  }
}

