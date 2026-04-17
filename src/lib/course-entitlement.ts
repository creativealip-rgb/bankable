import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, sidebarItems } from "@/db/schema";
import { hasPaidCourseAccess } from "@/lib/course-access";

const MAIN_ACCESS_TIERS = new Set(["BASIC", "PREMIUM", "LIFETIME"]);
const PAID_SIDEBAR_SECTIONS = new Set(["WEBINAR", "PREMIUM_VIDEO"]);

export async function hasMainCatalogAccess(userId: string): Promise<boolean> {
  const activeMembership = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, userId), eq(memberships.status, "ACTIVE")),
    columns: { tier: true },
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  if (!activeMembership) return false;
  return MAIN_ACCESS_TIERS.has(String(activeMembership.tier).toUpperCase());
}

export async function hasCourseLearningAccess(input: {
  userId: string;
  courseSlug: string;
  price: string | null;
}): Promise<boolean> {
  const isPaidCourse = await isPaidOfferingCourse(input.courseSlug, input.price);
  if (isPaidCourse) {
    return hasPaidCourseAccess(input.userId, input.courseSlug);
  }
  return hasMainCatalogAccess(input.userId);
}

export async function isPaidOfferingCourse(courseSlug: string, price: string | null): Promise<boolean> {
  if (Number(price || 0) > 0) return true;
  const paidSidebarSlugs = await getSidebarPaidCourseSlugSet();
  return paidSidebarSlugs.has(courseSlug);
}

export async function getSidebarPaidCourseSlugSet(): Promise<Set<string>> {
  const items = await db.query.sidebarItems.findMany({
    where: eq(sidebarItems.isActive, true),
    columns: { section: true, href: true },
  });
  const paidSlugs = new Set<string>();
  for (const item of items) {
    const section = String(item.section).toUpperCase();
    if (!PAID_SIDEBAR_SECTIONS.has(section)) continue;
    const href = item.href || "";
    if (!href.startsWith("/courses/")) continue;
    const slug = href.slice("/courses/".length).trim();
    if (slug) paidSlugs.add(slug);
  }
  return paidSlugs;
}

