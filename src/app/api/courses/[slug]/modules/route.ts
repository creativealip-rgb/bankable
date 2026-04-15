import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { modules, courses } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import crypto from "crypto";

type RouteParams = { params: Promise<{ slug: string }> };

// POST /api/courses/[slug]/modules — Add module to course (admin only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;

  try {
    await requireAdmin();
    const body = await request.json();

    const course = await db.query.courses.findFirst({
      where: eq(courses.slug, slug),
      with: { modules: { orderBy: [asc(modules.order)] } },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const { title } = body;
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const nextOrder = course.modules.length > 0
      ? Math.max(...course.modules.map((m) => m.order)) + 1
      : 0;

    const [newModule] = await db
      .insert(modules)
      .values({
        id: crypto.randomUUID(),
        courseId: course.id,
        title,
        order: nextOrder,
      })
      .returning();

    return NextResponse.json(newModule, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to add module:", error);
    return NextResponse.json({ error: "Failed to add module" }, { status: 500 });
  }
}

// PUT /api/courses/[slug]/modules — Reorder modules (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;

  try {
    await requireAdmin();
    const body = await request.json();

    const course = await db.query.courses.findFirst({
      where: eq(courses.slug, slug),
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // body.order = [{id: "module-id", order: 0}, {id: "module-id", order: 1}, ...]
    const { order } = body;
    if (!Array.isArray(order)) {
      return NextResponse.json({ error: "Order array is required" }, { status: 400 });
    }

    for (const item of order) {
      await db
        .update(modules)
        .set({ order: item.order })
        .where(eq(modules.id, item.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to reorder modules:", error);
    return NextResponse.json({ error: "Failed to reorder modules" }, { status: 500 });
  }
}
