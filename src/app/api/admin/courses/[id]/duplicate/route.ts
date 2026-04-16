import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { courses, modules, videos, quizzes, questions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";

type RouteParams = { params: Promise<{ id: string }> };

function suffixSlug(slug: string) {
  return `${slug}-copy-${Date.now().toString().slice(-5)}`;
}

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const session = await requireAdmin();
    const source = await db.query.courses.findFirst({
      where: eq(courses.id, id),
      with: {
        modules: {
          with: {
            videos: { orderBy: (videos, { asc }) => [asc(videos.order)] },
          },
          orderBy: (modules, { asc }) => [asc(modules.order)],
        },
        quiz: {
          with: {
            questions: { orderBy: (questions, { asc }) => [asc(questions.order)] },
          },
        },
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const newCourseId = crypto.randomUUID();
    const [copiedCourse] = await db
      .insert(courses)
      .values({
        id: newCourseId,
        title: `${source.title} (Copy)`,
        slug: suffixSlug(source.slug),
        description: source.description,
        type: source.type,
        category: source.category,
        level: source.level,
        thumbnail: source.thumbnail,
        price: source.price,
        status: "DRAFT",
        minWatchPct: source.minWatchPct,
        createdById: session.user.id,
      })
      .returning();

    for (const mod of source.modules) {
      const newModuleId = crypto.randomUUID();
      await db.insert(modules).values({
        id: newModuleId,
        courseId: newCourseId,
        title: mod.title,
        order: mod.order,
        releaseAt: mod.releaseAt,
      });

      for (const v of mod.videos) {
        await db.insert(videos).values({
          id: crypto.randomUUID(),
          moduleId: newModuleId,
          title: v.title,
          url: v.url,
          subtitleUrl: v.subtitleUrl,
          duration: v.duration,
          order: v.order,
        });
      }
    }

    if (source.quiz[0]) {
      const q = source.quiz[0];
      const newQuizId = crypto.randomUUID();
      await db.insert(quizzes).values({
        id: newQuizId,
        courseId: newCourseId,
        title: q.title,
        passingGrade: q.passingGrade,
        timeLimit: q.timeLimit,
        maxAttempts: q.maxAttempts,
        shuffleQuestions: q.shuffleQuestions,
        shuffleOptions: q.shuffleOptions,
        showAnswers: q.showAnswers,
      });

      for (const qs of q.questions) {
        await db.insert(questions).values({
          id: crypto.randomUUID(),
          quizId: newQuizId,
          type: qs.type,
          questionText: qs.questionText,
          options: qs.options,
          correctAnswer: qs.correctAnswer,
          points: qs.points,
          order: qs.order,
        });
      }
    }

    return NextResponse.json(copiedCourse, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json({ error: "Failed to duplicate course" }, { status: 500 });
  }
}

