import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quizzes, videoProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/auth-helpers";
import { hasCourseLearningAccess } from "@/lib/course-entitlement";

type RouteParams = { params: Promise<{ quizId: string }> };

// GET /api/quizzes/[quizId] — Get quiz with questions (only if all videos completed)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { quizId } = await params;

  try {
    const session = await requireMember();

    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
      with: {
        questions: {
          orderBy: (questions, { asc }) => [asc(questions.order)],
        },
        course: {
          with: {
            modules: {
              with: {
                videos: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }
    if (quiz.course.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const hasAccess = await hasCourseLearningAccess({
      userId: session.user.id,
      courseSlug: quiz.course.slug,
      price: quiz.course.price,
    });
    if (!hasAccess) {
      return NextResponse.json({ error: "Active access is required for this course" }, { status: 403 });
    }

    // Check if all videos are completed
    const allVideoIds = quiz.course.modules.flatMap((m) => m.videos.map((v) => v.id));

    const progress = await db.query.videoProgress.findMany({
      where: eq(videoProgress.userId, session.user.id),
    });

    const completedVideoIds = progress
      .filter((p) => p.isCompleted && allVideoIds.includes(p.videoId))
      .map((p) => p.videoId);

    if (completedVideoIds.length < allVideoIds.length) {
      return NextResponse.json(
        {
          error: "You must complete all videos before taking the quiz",
          completedVideos: completedVideoIds.length,
          totalVideos: allVideoIds.length,
        },
        { status: 403 }
      );
    }

    // Strip correct answers from questions for the client
    const sanitizedQuestions = quiz.questions.map((q) => ({
      id: q.id,
      type: q.type,
      questionText: q.questionText,
      points: q.points,
      order: q.order,
      options: q.options?.map((opt) => ({
        text: opt.text,
        // Don't send isCorrect to client
      })),
    }));

    return NextResponse.json({
      id: quiz.id,
      title: quiz.title,
      passingGrade: quiz.passingGrade,
      timeLimit: quiz.timeLimit,
      maxAttempts: quiz.maxAttempts,
      shuffleQuestions: quiz.shuffleQuestions,
      shuffleOptions: quiz.shuffleOptions,
      courseTitle: quiz.course.title,
      questions: sanitizedQuestions,
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to fetch quiz:", error);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}
