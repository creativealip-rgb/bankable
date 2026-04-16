import crypto from "crypto";
import { db } from "@/db";
import { courses, modules, videos } from "@/db/schema";
import { eq } from "drizzle-orm";

type SidebarSection = "WEBINAR" | "PREMIUM_VIDEO";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function ensureSidebarDetailHref(
  title: string,
  section: SidebarSection,
  createdById: string | null
): Promise<string> {
  const baseSlug = slugify(title);
  const slug = section === "WEBINAR" ? `${baseSlug}-webinar` : `${baseSlug}-premium`;

  const existing = await db.query.courses.findFirst({
    where: eq(courses.slug, slug),
    columns: { slug: true },
  });
  if (existing) {
    return `/courses/${existing.slug}`;
  }

  const courseId = crypto.randomUUID();
  const moduleId = crypto.randomUUID();

  const defaultPrice = section === "WEBINAR" ? "79000" : "149000";

  await db.insert(courses).values({
    id: courseId,
    title,
    slug,
    description:
      section === "WEBINAR"
        ? `Detail webinar: ${title}. Materi live session, replay, dan resources pendukung.`
        : `Detail premium video: ${title}. Konten berbayar terpisah dari paket one-time access.`,
    type: "SINGLE",
    category: section === "WEBINAR" ? "Marketing" : "Business",
    level: "INTERMEDIATE",
    price: defaultPrice,
    status: "PUBLISHED",
    minWatchPct: 90,
    createdById: createdById ?? null,
  });

  await db.insert(modules).values({
    id: moduleId,
    courseId,
    title: section === "WEBINAR" ? "Webinar Session" : "Premium Video Session",
    order: 0,
  });

  await db.insert(videos).values({
    id: crypto.randomUUID(),
    moduleId,
    title: section === "WEBINAR" ? `${title} - Replay` : `${title} - Full Video`,
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    duration: section === "WEBINAR" ? 5400 : 4200,
    order: 0,
  });

  return `/courses/${slug}`;
}

