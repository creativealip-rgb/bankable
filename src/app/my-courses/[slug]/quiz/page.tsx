"use client";

import { useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";

const quizData = [
  {
    id: 1,
    question: "Which keyboard shortcut is typically used to perform a Razor cut in Premiere Pro?",
    options: ["C", "V", "B", "R"],
    correct: 0
  },
  {
    id: 2,
    question: "When integrating Voice SFX, what is usually the best practice to avoid clipping audio?",
    options: ["Max the volume over 0dB", "Keep average peaks between -6dB and -12dB", "Add infinite reverb", "Mute the background track completely"],
    correct: 1
  }
];

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSelectOption = (optionIndex: number) => {
    setAnswers({
      ...answers,
      [currentQuestion]: optionIndex
    });
  };

  const currentQ = quizData[currentQuestion];
  const progressPercent = ((currentQuestion + 1) / quizData.length) * 100;
  
  const calculateScore = () => {
    let correct = 0;
    quizData.forEach((q, idx) => {
      if (answers[idx] === q.correct) correct++;
    });
    return (correct / quizData.length) * 100;
  };

  const score = isSubmitted ? calculateScore() : 0;
  const isPassed = score >= 70;

  if (isSubmitted) {
    return (
      <div className={styles.quizContainer}>
        <div className={styles.quizCard}>
          <div className={styles.glowTop}></div>
          <h2 className={styles.quizTitle} style={{ textAlign: "center", marginBottom: "2rem" }}>Quiz Results</h2>
          
          <div style={{ textAlign: "center" }}>
            <h1 className={isPassed ? styles.passText : ""}>
              {isPassed ? "Congratulations! 🎉" : "Keep Trying! 💪"}
            </h1>
            <p className={styles.scoreText}>Your score: <strong>{score}%</strong></p>
            
            {isPassed ? (
              <div className={styles.certificatePreview}>
                <h3 style={{ fontFamily: "var(--font-display)", marginBottom: "1rem" }}>🎓 Certificate of Completion</h3>
                <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
                  You have successfully completed the Video Editing Masterclass.
                </p>
                <button className="btn-primary" style={{ width: "100%", marginBottom: "1rem" }}>
                  Download Certificate (PDF)
                </button>
                <Link href="/dashboard" className="btn-secondary" style={{ display: "block", textAlign: "center" }}>
                  Back to Dashboard
                </Link>
              </div>
            ) : (
              <div style={{ marginTop: "2rem" }}>
                <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
                  You need at least 70% to pass and earn your certificate.
                </p>
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    setIsSubmitted(false);
                    setCurrentQuestion(0);
                    setAnswers({});
                  }}
                >
                  Retake Quiz
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.quizContainer}>
      <div className={styles.quizCard}>
        <div className={styles.glowTop}></div>
        
        <div className={styles.quizHeader}>
          <h1 className={styles.quizTitle}>Digital Creator Quiz</h1>
          <div className={styles.timer}>25:00</div>
        </div>

        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progressPercent}%` }}></div>
        </div>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
          Question {currentQuestion + 1} of {quizData.length}
        </p>

        <h2 className={styles.questionText}>
          {currentQ.question}
        </h2>

        <div className={styles.optionsList}>
          {currentQ.options.map((opt, idx) => (
            <div 
              key={idx} 
              className={`${styles.optionItem} ${answers[currentQuestion] === idx ? styles.selected : ""}`}
              onClick={() => handleSelectOption(idx)}
            >
              <div className={styles.optionMarker}></div>
              <span>{opt}</span>
            </div>
          ))}
        </div>

        <div className={styles.quizFooter}>
          <button 
            className="btn-secondary"
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            style={{ opacity: currentQuestion === 0 ? 0.5 : 1 }}
          >
            &larr; Previous
          </button>

          {currentQuestion < quizData.length - 1 ? (
            <button 
              className="btn-primary"
              onClick={() => setCurrentQuestion(prev => Math.min(quizData.length - 1, prev + 1))}
              disabled={answers[currentQuestion] === undefined}
            >
              Next &rarr;
            </button>
          ) : (
            <button 
              className="btn-primary"
              style={{ background: "var(--success)" }}
              onClick={() => setIsSubmitted(true)}
              disabled={answers[currentQuestion] === undefined}
            >
              Submit Quiz ✨
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
