import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions, quizzes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import crypto from "crypto";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/admin/courses/[id]/quiz/questions — Add a question
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: courseId } = await params;

  try {
    await requireAdmin();
    const body = await request.json();

    // Find quiz for this course
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.courseId, courseId),
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found for this course" }, { status: 404 });
    }

    const [question] = await db.insert(questions).values({
      id: crypto.randomUUID(),
      quizId: quiz.id,
      type: body.type || "MULTIPLE_CHOICE",
      questionText: body.questionText,
      options: body.options || null,
      correctAnswer: body.correctAnswer || null,
      points: body.points || 1,
      order: body.order || 0,
    }).returning();

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to add question:", error);
    return NextResponse.json({ error: "Failed to add question" }, { status: 500 });
  }
}
