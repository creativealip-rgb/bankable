import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";

type RouteParams = { params: Promise<{ id: string; questionId: string }> };

// DELETE /api/admin/courses/[id]/quiz/questions/[questionId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { questionId } = await params;

  try {
    await requireAdmin();

    await db.delete(questions).where(eq(questions.id, questionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to delete question:", error);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
