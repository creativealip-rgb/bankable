import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { certificates, courses, quizAttempts, quizzes } from "@/db/schema";
import { getSession } from "@/lib/auth-helpers";
import styles from "./page.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ attemptId?: string }>;
};

type AttemptAnswer = {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
};

export default async function QuizResultPage({ params, searchParams }: PageProps) {
  const [{ slug }, { attemptId }] = await Promise.all([params, searchParams]);
  const session = await getSession();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/my-courses/${slug}/quiz/result`)}`);
  }

  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, slug),
    columns: { id: true, title: true },
  });

  if (!course) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Quiz Result</h1>
          <p className={styles.muted}>Course tidak ditemukan.</p>
          <Link href="/my-courses" className="btn-secondary">Kembali ke My Courses</Link>
        </div>
      </div>
    );
  }

  const quiz = await db.query.quizzes.findFirst({
    where: eq(quizzes.courseId, course.id),
    columns: { id: true, title: true, passingGrade: true, maxAttempts: true, showAnswers: true },
  });

  if (!quiz) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Quiz Result</h1>
          <p className={styles.muted}>Course ini belum memiliki quiz.</p>
          <Link href={`/my-courses/${slug}`} className="btn-primary">Kembali ke Course</Link>
        </div>
      </div>
    );
  }

  const attempt = attemptId
    ? await db.query.quizAttempts.findFirst({
        where: and(eq(quizAttempts.id, attemptId), eq(quizAttempts.userId, session.user.id), eq(quizAttempts.quizId, quiz.id)),
      })
    : await db.query.quizAttempts.findFirst({
        where: and(eq(quizAttempts.userId, session.user.id), eq(quizAttempts.quizId, quiz.id)),
        orderBy: [desc(quizAttempts.completedAt), desc(quizAttempts.startedAt)],
      });

  if (!attempt) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Quiz Result</h1>
          <p className={styles.muted}>Belum ada attempt quiz untuk course ini.</p>
          <Link href={`/my-courses/${slug}/quiz`} className="btn-primary">Mulai Quiz</Link>
        </div>
      </div>
    );
  }

  const [allAttempts, certificate] = await Promise.all([
    db.query.quizAttempts.findMany({
      where: and(eq(quizAttempts.userId, session.user.id), eq(quizAttempts.quizId, quiz.id)),
      columns: { id: true },
    }),
    db.query.certificates.findFirst({
      where: and(eq(certificates.userId, session.user.id), eq(certificates.courseId, course.id)),
      columns: { certificateNumber: true },
    }),
  ]);

  const score = Number(attempt.score);
  const answers = Array.isArray(attempt.answers) ? (attempt.answers as AttemptAnswer[]) : [];
  const correctAnswers = answers.filter((item) => item.isCorrect).length;
  const attemptsRemaining = Math.max(0, quiz.maxAttempts - allAttempts.length);
  const passed = Boolean(attempt.passed);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Quiz Result</h1>
        <p className={styles.subtitle}>{course.title}</p>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>Score</div>
            <div className={`${styles.summaryValue} ${passed ? styles.success : styles.danger}`}>{score.toFixed(0)}%</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>Status</div>
            <div className={styles.summaryValue}>{passed ? "Passed" : "Not passed"}</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>Correct</div>
            <div className={styles.summaryValue}>{correctAnswers}/{answers.length}</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>Attempts Left</div>
            <div className={styles.summaryValue}>{attemptsRemaining}</div>
          </div>
        </div>

        {passed && certificate ? (
          <div className={styles.notice}>
            <strong>Sertifikat aktif:</strong> {certificate.certificateNumber}
          </div>
        ) : null}

        {!passed ? (
          <p className={styles.muted}>Target kelulusan: minimum {quiz.passingGrade}%.</p>
        ) : null}

        {quiz.showAnswers && answers.length > 0 ? (
          <div className={styles.reviewList}>
            <h2 className={styles.reviewTitle}>Answer Review</h2>
            {answers.map((answer, index) => (
              <div key={answer.questionId} className={styles.reviewItem}>
                <div className={styles.reviewHead}>
                  <span>{answer.isCorrect ? "✅" : "❌"} Question {index + 1}</span>
                </div>
                <div className={styles.reviewAnswer}>
                  {Array.isArray(answer.answer) ? answer.answer.join(", ") : answer.answer || "(no answer)"}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className={styles.actions}>
          <Link href={`/my-courses/${slug}/quiz`} className="btn-primary">Back to Quiz</Link>
          <Link href={`/my-courses/${slug}`} className="btn-secondary">Back to Course</Link>
          {certificate ? <Link href="/certificates" className="btn-secondary">My Certificates</Link> : null}
        </div>
      </div>
    </div>
  );
}

