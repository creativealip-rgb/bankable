import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quizzes, quizAttempts, certificates, videoProgress } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { requireMember } from "@/lib/auth-helpers";
import crypto from "crypto";
import { generateCertificateNumber, getCertificatePdfPath } from "@/lib/certificates";
import { hasCourseLearningAccess } from "@/lib/course-entitlement";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

type RouteParams = { params: Promise<{ quizId: string }> };
const MAX_CERTIFICATE_INSERT_RETRIES = 5;

function isCertificateNumberConflict(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as {
    code?: string;
    constraint?: string;
    cause?: { code?: string; constraint?: string };
  };
  const code = maybeError.code ?? maybeError.cause?.code;
  if (code !== "23505") return false;
  const constraint = maybeError.constraint ?? maybeError.cause?.constraint;
  return typeof constraint === "string" ? constraint.includes("certificate_number") : true;
}

// POST /api/quizzes/[quizId]/submit — Submit quiz answers
export async function POST(request: NextRequest, { params }: RouteParams) {
  const limited = enforceRateLimit(request, { namespace: "quiz:submit", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const { quizId } = await params;

  try {
    const session = await requireMember();
    const body = await request.json();
    const { answers } = body; // [{questionId, answer}]

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Answers array is required" }, { status: 400 });
    }
    if (answers.length > 200) {
      return NextResponse.json({ error: "Too many answers submitted" }, { status: 400 });
    }

    // Get quiz with questions and course
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
      with: {
        questions: true,
        course: {
          with: {
            modules: {
              with: {
                videos: {
                  columns: { id: true },
                },
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

    const allVideoIds = quiz.course.modules.flatMap((m) => m.videos.map((v) => v.id));
    if (allVideoIds.length > 0) {
      const completedRows = await db.query.videoProgress.findMany({
        where: and(
          eq(videoProgress.userId, session.user.id),
          eq(videoProgress.isCompleted, true),
          inArray(videoProgress.videoId, allVideoIds)
        ),
        columns: { videoId: true },
      });
      const completedVideoIds = new Set(completedRows.map((row) => row.videoId));
      if (completedVideoIds.size < allVideoIds.length) {
        return NextResponse.json(
          {
            error: "You must complete all videos before submitting the quiz",
            completedVideos: completedVideoIds.size,
            totalVideos: allVideoIds.length,
          },
          { status: 403 }
        );
      }
    }

    // Check max attempts
    const existingAttempts = await db.query.quizAttempts.findMany({
      where: and(
        eq(quizAttempts.userId, session.user.id),
        eq(quizAttempts.quizId, quizId)
      ),
    });

    if (existingAttempts.length >= quiz.maxAttempts) {
      return NextResponse.json(
        { error: "Maximum attempts reached", maxAttempts: quiz.maxAttempts },
        { status: 403 }
      );
    }

    // Grade the quiz
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers: { questionId: string; answer: string | string[]; isCorrect: boolean }[] = [];

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const userAnswer = answers.find((a: { questionId: string }) => a.questionId === question.id);

      if (!userAnswer) {
        gradedAnswers.push({ questionId: question.id, answer: "", isCorrect: false });
        continue;
      }

      let isCorrect = false;

      if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
        // Check if selected option is correct
        const correctOption = question.options?.find((opt) => opt.isCorrect);
        isCorrect = correctOption?.text === userAnswer.answer;
      } else if (question.type === "MULTI_SELECT") {
        // All correct options must be selected and no wrong ones
        const correctTexts = question.options
          ?.filter((opt) => opt.isCorrect)
          .map((opt) => opt.text) || [];
        const userAnswers = Array.isArray(userAnswer.answer) ? userAnswer.answer : [userAnswer.answer];
        isCorrect =
          correctTexts.length === userAnswers.length &&
          correctTexts.every((t) => userAnswers.includes(t));
      } else if (question.type === "SHORT_ANSWER") {
        isCorrect =
          question.correctAnswer?.toLowerCase().trim() ===
          String(userAnswer.answer).toLowerCase().trim();
      }

      if (isCorrect) earnedPoints += question.points;
      gradedAnswers.push({
        questionId: question.id,
        answer: userAnswer.answer,
        isCorrect,
      });
    }

    const scorePercent = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = scorePercent >= quiz.passingGrade;

    // Create quiz attempt
    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        quizId,
        score: String(scorePercent.toFixed(2)),
        passed,
        answers: gradedAnswers,
        completedAt: new Date(),
      })
      .returning();

    // Generate certificate if passed
    let certificate = null;
    if (passed) {
      // Check if certificate already exists for this course
      const existingCert = await db.query.certificates.findFirst({
        where: and(
          eq(certificates.userId, session.user.id),
          eq(certificates.courseId, quiz.course.id)
        ),
      });

      if (!existingCert) {
        for (let i = 0; i < MAX_CERTIFICATE_INSERT_RETRIES; i++) {
          const certNumber = generateCertificateNumber(quiz.course.slug);
          try {
            [certificate] = await db
              .insert(certificates)
              .values({
                id: crypto.randomUUID(),
                userId: session.user.id,
                courseId: quiz.course.id,
                quizAttemptId: attempt.id,
                certificateNumber: certNumber,
                score: String(scorePercent.toFixed(2)),
                pdfUrl: getCertificatePdfPath(certNumber),
              })
              .returning();
            break;
          } catch (insertError) {
            if (isCertificateNumberConflict(insertError) && i < MAX_CERTIFICATE_INSERT_RETRIES - 1) {
              continue;
            }
            throw insertError;
          }
        }
      }
    }

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        score: scorePercent,
        passed,
        totalQuestions: quiz.questions.length,
        correctAnswers: gradedAnswers.filter((a) => a.isCorrect).length,
        attemptsRemaining: quiz.maxAttempts - existingAttempts.length - 1,
      },
      answers: quiz.showAnswers ? gradedAnswers : undefined,
      certificate: certificate
        ? {
            certificateNumber: certificate.certificateNumber,
            courseTitle: quiz.course.title,
          }
        : null,
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    logError("quiz.submit.failed", error, { quizId });
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}
