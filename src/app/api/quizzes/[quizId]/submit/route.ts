import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quizzes, questions, quizAttempts, certificates, courses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireMember } from "@/lib/auth-helpers";
import crypto from "crypto";

type RouteParams = { params: Promise<{ quizId: string }> };

// POST /api/quizzes/[quizId]/submit — Submit quiz answers
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { quizId } = await params;

  try {
    const session = await requireMember();
    const body = await request.json();
    const { answers } = body; // [{questionId, answer}]

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Answers array is required" }, { status: 400 });
    }

    // Get quiz with questions and course
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
      with: {
        questions: true,
        course: true,
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
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
        const year = new Date().getFullYear();
        const courseCode = quiz.course.slug
          .split("-")
          .map((w) => w[0]?.toUpperCase())
          .join("")
          .slice(0, 3);
        const random = String(Math.floor(Math.random() * 99999)).padStart(5, "0");
        const certNumber = `BNK-${year}-${courseCode}-${random}`;

        [certificate] = await db
          .insert(certificates)
          .values({
            id: crypto.randomUUID(),
            userId: session.user.id,
            courseId: quiz.course.id,
            quizAttemptId: attempt.id,
            certificateNumber: certNumber,
            score: String(scorePercent.toFixed(2)),
          })
          .returning();
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
    console.error("Failed to submit quiz:", error);
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}
