import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, sidebarItems } from "@/db/schema";
import { ilike, or } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Search in Courses
    const courseResults = await db.query.courses.findMany({
      where: or(
        ilike(courses.title, `%${query}%`),
        ilike(courses.description, `%${query}%`)
      ),
      limit: 5,
      columns: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        type: true,
      }
    });

    // Search in Sidebar Items (Webinars/Premium)
    const sidebarResults = await db.query.sidebarItems.findMany({
      where: or(
        ilike(sidebarItems.title, `%${query}%`),
        ilike(sidebarItems.subtitle, `%${query}%`)
      ),
      limit: 3,
    });

    const results = [
      ...courseResults.map(c => ({
        id: c.id,
        title: c.title,
        type: c.type === 'EBOOK' ? 'Ebook' : 'Course',
        href: `/courses/${c.slug}`,
        category: 'Courses & Ebooks'
      })),
      ...sidebarResults.map(s => ({
        id: s.id,
        title: s.title,
        type: s.section === 'WEBINAR' ? 'Webinar' : 'Premium Video',
        href: s.href || '/courses',
        category: 'Webinars & Specials'
      }))
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Failed to fetch search results" }, { status: 500 });
  }
}
