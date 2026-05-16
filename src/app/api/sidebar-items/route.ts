import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, sidebarItems } from "@/db/schema";
import { asc, eq, inArray } from "drizzle-orm";

function extractCourseSlug(href: string | null): string | null {
  if (!href) return null;
  const match = href.match(/^\/courses\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

function formatRupiah(price: string | null): string | null {
  if (!price) return null;
  const amount = Number(price);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return `Rp${amount.toLocaleString("id-ID")}`;
}

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(sidebarItems)
      .where(eq(sidebarItems.isActive, true))
      .orderBy(
        asc(sidebarItems.section),
        asc(sidebarItems.sortOrder),
        asc(sidebarItems.createdAt),
      );

    const webinarSlugs = Array.from(
      new Set(
        rows
          .filter((item) => item.section === "WEBINAR")
          .map((item) => extractCourseSlug(item.href))
          .filter((slug): slug is string => Boolean(slug)),
      ),
    );

    const webinarPriceMap = new Map<string, string>();

    if (webinarSlugs.length > 0) {
      const webinarCourses = await db
        .select({ slug: courses.slug, price: courses.price })
        .from(courses)
        .where(inArray(courses.slug, webinarSlugs));

      for (const course of webinarCourses) {
        const formatted = formatRupiah(course.price);
        if (formatted) webinarPriceMap.set(course.slug, formatted);
      }
    }

    const webinars = rows
      .filter((item) => item.section === "WEBINAR")
      .map((item) => {
        const slug = extractCourseSlug(item.href);
        const linkedPrice = slug ? webinarPriceMap.get(slug) : null;

        if (!linkedPrice) return item;

        return {
          ...item,
          priceLabel: linkedPrice,
        };
      });

    const premiumVideos = rows.filter(
      (item) => item.section === "PREMIUM_VIDEO",
    );

    return NextResponse.json({ webinars, premiumVideos });
  } catch (error) {
    console.error("Failed to fetch sidebar items:", error);
    return NextResponse.json(
      { error: "Failed to fetch sidebar items" },
      { status: 500 },
    );
  }
}
