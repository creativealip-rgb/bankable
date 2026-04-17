"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";
import Link from "next/link";

type QuizOption = { text: string };
type QuizQuestion = {
  id: string;
  type: string;
  questionText: string;
  points: number;
  order: number;
  options?: QuizOption[];
};

type QuizData = {
  id: string;
  title: string;
  passingGrade: number;
  timeLimit: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  courseTitle: string;
  questions: QuizQuestion[];
};

type SubmitResult = {
  attempt: {
    id: string;
    score: number;
    passed: boolean;
    totalQuestions: number;
    correctAnswers: number;
    attemptsRemaining: number;
  };
  answers?: { questionId: string; answer: string | string[]; isCorrect: boolean }[];
  certificate: { certificateNumber: string; courseTitle: string } | null;
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizPage({ params }: PageProps) {
  const [slug, setSlug] = useState("");
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [showNav, setShowNav] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submitRef = useRef<() => void>(() => {});

  // Resolve params
  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  // Get quizId from URL search params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setQuizId(searchParams.get("quizId"));
  }, []);

  // Fetch quiz data
  useEffect(() => {
    if (!quizId) return;

    async function fetchQuiz() {
      try {
        const res = await fetch(`/api/quizzes/${quizId}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to load quiz");
          return;
        }
        const data: QuizData = await res.json();

        // Shuffle if needed
        if (data.shuffleQuestions) {
          data.questions = shuffleArray(data.questions);
        }
        if (data.shuffleOptions) {
          data.questions = data.questions.map((q) => ({
            ...q,
            options: q.options ? shuffleArray(q.options) : q.options,
          }));
        }

        setQuiz(data);
        setTimeLeft(data.timeLimit * 60); // convert to seconds
      } catch {
        setError("Failed to load quiz");
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [quizId]);

  // Timer
  useEffect(() => {
    if (!quiz || isSubmitted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-submit on time up
          clearInterval(timerRef.current!);
          submitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quiz, isSubmitted]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const handleSelectOption = (questionId: string, optionText: string, type: string) => {
    if (type === "MULTI_SELECT") {
      const current = (answers[questionId] as string[]) || [];
      const updated = current.includes(optionText)
        ? current.filter((t) => t !== optionText)
        : [...current, optionText];
      setAnswers({ ...answers, [questionId]: updated });
    } else {
      setAnswers({ ...answers, [questionId]: optionText });
    }
  };

  const handleShortAnswer = (questionId: string, text: string) => {
    setAnswers({ ...answers, [questionId]: text });
  };

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview((prev) => {
      const s = new Set(prev);
      if (s.has(questionId)) s.delete(questionId);
      else s.add(questionId);
      return s;
    });
  };

  async function handleSubmit(skipConfirmation = false) {
    if (!quiz || submitting) return;
    if (!skipConfirmation && !confirm("Are you sure you want to submit your quiz?")) return;

    setSubmitting(true);
    setSubmitError(null);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const formattedAnswers = quiz.questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || "",
      }));

      const res = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      if (res.ok) {
        const data: SubmitResult = await res.json();
        setResult(data);
        setIsSubmitted(true);
      } else {
        const data = await res.json();
        setSubmitError(data.error || "Failed to submit quiz");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }
  submitRef.current = () => {
    void handleSubmit(true);
  };

  if (loading) {
    return (
      <div className={styles.quizContainer}>
        <div className={styles.quizCard}>
          <div className={styles.glowTop}></div>
          <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)" }}>
            Loading quiz...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.quizContainer}>
        <div className={styles.quizCard}>
          <div className={styles.glowTop}></div>
          <div style={{ textAlign: "center", padding: "3rem 0" }}>
            <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "1rem" }}>⚠️ Quiz Locked</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>{error}</p>
            <Link href={`/my-courses/${slug}`} className="btn-primary">
              Back to Course
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  // Results screen
  if (isSubmitted && result) {
    const { attempt, certificate } = result;
    return (
      <div className={styles.quizContainer}>
        <div className={styles.quizCard}>
          <div className={styles.glowTop}></div>
          <h2 className={styles.quizTitle} style={{ textAlign: "center", marginBottom: "2rem" }}>
            Quiz Results
          </h2>

          <div style={{ textAlign: "center" }}>
            <h1 className={attempt.passed ? styles.passText : ""} style={{ fontFamily: "var(--font-display)", fontSize: "2rem", marginBottom: "0.5rem" }}>
              {attempt.passed ? "Congratulations! 🎉" : "Keep Trying! 💪"}
            </h1>
            <p className={styles.scoreText}>
              Your score: <strong>{attempt.score.toFixed(0)}%</strong>
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>
              {attempt.correctAnswers} / {attempt.totalQuestions} correct •{" "}
              {attempt.attemptsRemaining > 0
                ? `${attempt.attemptsRemaining} attempts remaining`
                : "No attempts remaining"}
            </p>

            {/* Answer Review */}
            {result.answers && (
              <div style={{ textAlign: "left", marginBottom: "2rem" }}>
                <h3 style={{ fontFamily: "var(--font-display)", marginBottom: "1rem" }}>Answer Review</h3>
                {result.answers.map((a, i) => {
                  const q = quiz.questions.find((q) => q.id === a.questionId);
                  return (
                    <div
                      key={a.questionId}
                      style={{
                        padding: "1rem",
                        border: `1px solid ${a.isCorrect ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
                        borderRadius: "10px",
                        marginBottom: "0.5rem",
                        background: a.isCorrect ? "rgba(52,211,153,0.05)" : "rgba(248,113,113,0.05)",
                      }}
                    >
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                        {a.isCorrect ? "✅" : "❌"} Q{i + 1}: {q?.questionText}
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                        Your answer: {Array.isArray(a.answer) ? a.answer.join(", ") : a.answer || "(no answer)"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {certificate ? (
              <div className={styles.certificatePreview}>
                <h3 style={{ fontFamily: "var(--font-display)", marginBottom: "1rem" }}>
                  🏆 Certificate Earned!
                </h3>
                <p style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                  Certificate Number: <strong style={{ color: "var(--primary)" }}>{certificate.certificateNumber}</strong>
                </p>
                <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
                  {certificate.courseTitle}
                </p>
                <Link href="/certificates" className="btn-primary" style={{ display: "block", textAlign: "center", marginBottom: "1rem" }}>
                  View My Certificates
                </Link>
                <Link href="/dashboard" className="btn-secondary" style={{ display: "block", textAlign: "center" }}>
                  Back to Dashboard
                </Link>
              </div>
            ) : attempt.passed ? (
              <div className={styles.certificatePreview}>
                <h3 style={{ fontFamily: "var(--font-display)", marginBottom: "1rem" }}>
                  🏆 You already have a certificate for this course!
                </h3>
                <Link href="/certificates" className="btn-primary" style={{ display: "block", textAlign: "center" }}>
                  View My Certificates
                </Link>
              </div>
            ) : (
              <div style={{ marginTop: "1rem" }}>
                <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                  You need at least {quiz.passingGrade}% to pass and earn your certificate.
                </p>
                {attempt.attemptsRemaining > 0 ? (
                  <button className="btn-primary" onClick={() => window.location.reload()}>
                    Retake Quiz
                  </button>
                ) : (
                  <p style={{ color: "var(--danger)" }}>
                    No attempts remaining. Contact admin for assistance.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz taking screen
  const currentQ = quiz.questions[currentQuestion];
  const progressPercent = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const answeredCount = Object.keys(answers).filter((k) => answers[k] && (Array.isArray(answers[k]) ? (answers[k] as string[]).length > 0 : true)).length;
  const isTimeWarning = timeLeft < 60;

  return (
    <div className={styles.quizContainer}>
      <div className={styles.quizCard}>
        <div className={styles.glowTop}></div>

        <div className={styles.quizHeader}>
          <div>
            <h1 className={styles.quizTitle}>{quiz.title}</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{quiz.courseTitle}</p>
          </div>
          <div className={styles.timer} style={{ color: isTimeWarning ? "var(--danger)" : "var(--warning)" }}>
            ⏱️ {formatTime(timeLeft)}
          </div>
        </div>

        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progressPercent}%` }}></div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Question {currentQuestion + 1} of {quiz.questions.length}
          </p>
          <button
            style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.85rem", cursor: "pointer" }}
            onClick={() => setShowNav(!showNav)}
          >
            {showNav ? "Hide Navigator" : "📋 Question Navigator"} ({answeredCount}/{quiz.questions.length})
          </button>
        </div>

        {/* Question Navigator */}
        {showNav && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(42px, 1fr))",
            gap: "0.5rem",
            marginBottom: "1.5rem",
            padding: "1rem",
            background: "rgba(255,255,255,0.9)",
            borderRadius: "12px",
            border: "1px solid rgba(63,63,70,0.3)",
          }}>
            {quiz.questions.map((q, i) => {
              const isAnswered = !!answers[q.id] && (Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).length > 0 : true);
              const isMarked = markedForReview.has(q.id);
              const isCurrent = i === currentQuestion;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestion(i)}
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "8px",
                    border: isCurrent ? "2px solid var(--primary)" : "1px solid rgba(63,63,70,0.4)",
                    background: isAnswered ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.86)",
                    color: isAnswered ? "var(--primary)" : "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  {i + 1}
                  {isMarked && (
                    <span style={{ position: "absolute", top: "-4px", right: "-4px", fontSize: "0.7rem" }}>🚩</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Question */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {currentQ.type.replace("_", " ")} • {currentQ.points} pt{currentQ.points > 1 ? "s" : ""}
          </span>
          <button
            onClick={() => toggleMarkForReview(currentQ.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.85rem",
              color: markedForReview.has(currentQ.id) ? "var(--warning)" : "var(--text-muted)",
            }}
          >
            {markedForReview.has(currentQ.id) ? "🚩 Marked" : "🏳️ Mark for review"}
          </button>
        </div>

        <h2 className={styles.questionText}>{currentQ.questionText}</h2>

        {/* Options */}
        {currentQ.type === "SHORT_ANSWER" ? (
          <div style={{ marginBottom: "3rem" }}>
            <input
              type="text"
              value={(answers[currentQ.id] as string) || ""}
              onChange={(e) => handleShortAnswer(currentQ.id, e.target.value)}
              placeholder="Type your answer here..."
              style={{
                width: "100%",
                padding: "14px 16px",
                background: "rgba(255,255,255,0.92)",
                border: "2px solid rgba(63,63,70,0.5)",
                borderRadius: "12px",
                color: "var(--text-main)",
                fontFamily: "var(--font-sans)",
                fontSize: "1rem",
              }}
            />
          </div>
        ) : (
          <div className={styles.optionsList}>
            {currentQ.options?.map((opt, idx) => {
              const isSelected =
                currentQ.type === "MULTI_SELECT"
                  ? ((answers[currentQ.id] as string[]) || []).includes(opt.text)
                  : answers[currentQ.id] === opt.text;

              return (
                <div
                  key={idx}
                  className={`${styles.optionItem} ${isSelected ? styles.selected : ""}`}
                  onClick={() => handleSelectOption(currentQ.id, opt.text, currentQ.type)}
                >
                  <div className={styles.optionMarker}></div>
                  <span>{opt.text}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Nav */}
        {submitError ? (
          <div
            role="alert"
            style={{
              marginBottom: "1rem",
              borderRadius: "10px",
              border: "1px solid rgba(248, 113, 113, 0.3)",
              background: "rgba(248, 113, 113, 0.08)",
              color: "var(--danger)",
              fontSize: "0.85rem",
              lineHeight: 1.45,
              padding: "0.65rem 0.8rem",
            }}
          >
            {submitError}
          </div>
        ) : null}
        <div className={styles.quizFooter}>
          <button
            className="btn-secondary"
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            style={{ opacity: currentQuestion === 0 ? 0.5 : 1 }}
          >
            ← Previous
          </button>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            {currentQuestion < quiz.questions.length - 1 ? (
              <button
                className="btn-primary"
                onClick={() => setCurrentQuestion((prev) => Math.min(quiz.questions.length - 1, prev + 1))}
              >
                Next →
              </button>
            ) : (
              <button
                className="btn-primary"
                style={{ background: "var(--success)" }}
                onClick={() => {
                  void handleSubmit();
                }}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Quiz ✨"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
