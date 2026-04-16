import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quizzes, questions, courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import crypto from "crypto";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/admin/courses/[id]/quiz — Get quiz with all questions (admin view, includes correct answers)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: courseId } = await params;

  try {
    await requireAdmin();

    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.courseId, courseId),
      with: {
        questions: {
          orderBy: (questions, { asc }) => [asc(questions.order)],
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "No quiz found for this course" }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to fetch quiz:", error);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}

// POST /api/admin/courses/[id]/quiz — Create quiz for course
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: courseId } = await params;

  try {
    await requireAdmin();
    const body = await request.json();

    // Check course exists
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check quiz doesn't already exist
    const existing = await db.query.quizzes.findFirst({
      where: eq(quizzes.courseId, courseId),
    });

    if (existing) {
      return NextResponse.json({ error: "Quiz already exists for this course" }, { status: 409 });
    }

    const [quiz] = await db.insert(quizzes).values({
      id: crypto.randomUUID(),
      courseId,
      title: body.title || "Final Quiz",
      passingGrade: body.passingGrade || 70,
      timeLimit: body.timeLimit || 30,
      maxAttempts: body.maxAttempts || 3,
      shuffleQuestions: body.shuffleQuestions || false,
      shuffleOptions: body.shuffleOptions || false,
      showAnswers: body.showAnswers !== undefined ? body.showAnswers : true,
    }).returning();

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to create quiz:", error);
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
  }
}

// PUT /api/admin/courses/[id]/quiz — Update quiz settings
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id: courseId } = await params;

  try {
    await requireAdmin();
    const body = await request.json();

    const existing = await db.query.quizzes.findFirst({
      where: eq(quizzes.courseId, courseId),
    });

    if (!existing) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const [updated] = await db.update(quizzes).set({
      ...(body.title && { title: body.title }),
      ...(body.passingGrade !== undefined && { passingGrade: body.passingGrade }),
      ...(body.timeLimit !== undefined && { timeLimit: body.timeLimit }),
      ...(body.maxAttempts !== undefined && { maxAttempts: body.maxAttempts }),
      ...(body.shuffleQuestions !== undefined && { shuffleQuestions: body.shuffleQuestions }),
      ...(body.shuffleOptions !== undefined && { shuffleOptions: body.shuffleOptions }),
      ...(body.showAnswers !== undefined && { showAnswers: body.showAnswers }),
    }).where(eq(quizzes.id, existing.id)).returning();

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to update quiz:", error);
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 });
  }
}
