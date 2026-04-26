"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type QuizOption = { text: string; isCorrect: boolean };
type Question = {
  id: string; type: string; questionText: string;
  options: QuizOption[] | null; correctAnswer: string | null;
  points: number; order: number;
};
type Quiz = {
  id: string; title: string; passingGrade: number; timeLimit: number;
  maxAttempts: number; shuffleQuestions: boolean; shuffleOptions: boolean;
  showAnswers: boolean; courseId: string;
  questions: Question[];
};
type CourseInfo = { id: string; title: string; slug: string };

type PageProps = { params: Promise<{ id: string }> };

export default function AdminQuizPage({ params }: PageProps) {
  const [courseId, setCourseId] = useState("");
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Quiz form
  const [quizTitle, setQuizTitle] = useState("Final Quiz");
  const [passingGrade, setPassingGrade] = useState(70);
  const [timeLimit, setTimeLimit] = useState(30);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [shuffleQ, setShuffleQ] = useState(false);
  const [shuffleO, setShuffleO] = useState(false);
  const [showAnswers, setShowAnswers] = useState(true);

  // Questions
  const [questionsList, setQuestionsList] = useState<Question[]>([]);

  // New question form
  const [newType, setNewType] = useState("MULTIPLE_CHOICE");
  const [newText, setNewText] = useState("");
  const [newOptions, setNewOptions] = useState<QuizOption[]>([
    { text: "", isCorrect: true }, { text: "", isCorrect: false },
    { text: "", isCorrect: false }, { text: "", isCorrect: false },
  ]);
  const [newCorrectAnswer, setNewCorrectAnswer] = useState("");
  const [newPoints, setNewPoints] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => { params.then((p) => setCourseId(p.id)); }, [params]);

  useEffect(() => {
    if (!courseId) return;
    async function fetchData() {
      try {
        // Get course info
        const coursesRes = await fetch("/api/admin/courses");
        if (!coursesRes.ok) return;
        const courses = await coursesRes.json();
        const found = courses.find((c: CourseInfo & { id: string }) => c.id === courseId);
        if (!found) return;
        setCourseInfo(found);

        // Get quiz if exists
        const detailRes = await fetch(`/api/courses/${found.slug}`);
        if (!detailRes.ok) return;
        const detail = await detailRes.json();

        if (detail.quiz && detail.quiz.length > 0) {
          // Fetch full quiz with questions (admin needs to see answers)
          const qRes = await fetch(`/api/admin/courses/${courseId}/quiz`);
          if (qRes.ok) {
            const qData = await qRes.json();
            setQuiz(qData);
            setQuizTitle(qData.title);
            setPassingGrade(qData.passingGrade);
            setTimeLimit(qData.timeLimit);
            setMaxAttempts(qData.maxAttempts);
            setShuffleQ(qData.shuffleQuestions);
            setShuffleO(qData.shuffleOptions);
            setShowAnswers(qData.showAnswers);
            setQuestionsList(qData.questions || []);
          }
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchData();
  }, [courseId]);

  const handleSaveQuiz = async () => {
    if (!courseId) return;
    setSaving(true); setSaved(false);
    try {
      const body = {
        title: quizTitle, passingGrade, timeLimit, maxAttempts,
        shuffleQuestions: shuffleQ, shuffleOptions: shuffleO, showAnswers,
      };

      const res = await fetch(`/api/admin/courses/${courseId}/quiz`, {
        method: quiz ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setQuiz(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save quiz");
      }
    } catch { alert("Network error"); } finally { setSaving(false); }
  };

  const handleAddQuestion = async () => {
    if (!quiz || !newText.trim()) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        type: newType, questionText: newText, points: newPoints,
        order: questionsList.length,
      };

      if (newType === "SHORT_ANSWER") {
        body.correctAnswer = newCorrectAnswer;
      } else {
        body.options = newOptions.filter((o) => o.text.trim());
      }

      const res = await fetch(`/api/admin/courses/${courseId}/quiz/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const newQ = await res.json();
        setQuestionsList([...questionsList, newQ]);
        resetQuestionForm();
        setShowAddForm(false);
      }
    } catch { alert("Failed to add question"); } finally { setSaving(false); }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/quiz/questions/${qId}`, { method: "DELETE" });
      if (res.ok) setQuestionsList(questionsList.filter((q) => q.id !== qId));
    } catch { alert("Failed to delete"); }
  };

  const resetQuestionForm = () => {
    setNewType("MULTIPLE_CHOICE"); setNewText(""); setNewPoints(1); setNewCorrectAnswer("");
    setNewOptions([
      { text: "", isCorrect: true }, { text: "", isCorrect: false },
      { text: "", isCorrect: false }, { text: "", isCorrect: false },
    ]);
  };

  if (loading) return <div className="admin-page-header"><h1 className="admin-page-title">Loading...</h1></div>;

  return (
    <>
      <div className="admin-page-header">
        <div>
          <Link href={`/admin/courses/${courseId}/edit`} style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>← Back to course</Link>
          <h1 className="admin-page-title" style={{ marginTop: "0.5rem" }}>Quiz Management</h1>
          <p className="admin-page-subtitle">{courseInfo?.title}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {saved && <span style={{ color: "var(--success)", fontSize: "0.9rem" }}>✓ Saved</span>}
          <button className="btn-primary" style={{ padding: "10px 24px", fontSize: "0.9rem" }} onClick={handleSaveQuiz} disabled={saving}>
            {saving ? "Saving..." : quiz ? "Update Quiz" : "Create Quiz"}
          </button>
        </div>
      </div>

      {/* Quiz Settings */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Quiz Settings</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem" }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Quiz Title</label>
            <input className="admin-search-input" style={{ width: "100%", minWidth: 0 }} value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Passing Grade (%)</label>
            <input className="admin-search-input" style={{ width: "100%", minWidth: 0 }} type="number" min={0} max={100} value={passingGrade} onChange={(e) => setPassingGrade(parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Time Limit (min)</label>
            <input className="admin-search-input" style={{ width: "100%", minWidth: 0 }} type="number" min={1} value={timeLimit} onChange={(e) => setTimeLimit(parseInt(e.target.value) || 30)} />
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Max Attempts</label>
            <input className="admin-search-input" style={{ width: "100%", minWidth: 0 }} type="number" min={1} value={maxAttempts} onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 3)} />
          </div>
          <div></div>
        </div>
        <div style={{ display: "flex", gap: "2rem", marginTop: "1rem", flexWrap: "wrap" }}>
          {[
            { label: "Shuffle Questions", val: shuffleQ, set: setShuffleQ },
            { label: "Shuffle Options", val: shuffleO, set: setShuffleO },
            { label: "Show Answers After Submit", val: showAnswers, set: setShowAnswers },
          ].map(({ label, val, set }) => (
            <label key={label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem", color: "var(--text-muted)" }}>
              <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }} />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Questions */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Questions ({questionsList.length})</h2>
          {quiz && (
            <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}
              onClick={() => { setShowAddForm(!showAddForm); resetQuestionForm(); }}>
              {showAddForm ? "Cancel" : "+ Add Question"}
            </button>
          )}
        </div>

        {!quiz && (
          <div className="admin-empty" style={{ padding: "2rem" }}>
            Save quiz settings first to start adding questions.
          </div>
        )}

        {/* Add Question Form */}
        {showAddForm && (
          <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.9)", borderRadius: "12px", border: "1px solid rgba(63,63,70,0.3)", marginBottom: "1.5rem" }}>
            <h4 style={{ fontFamily: "var(--font-display)", marginBottom: "1rem" }}>New Question</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Type</label>
                <select className="admin-search-input" style={{ width: "100%", minWidth: 0 }} value={newType}
                  onChange={(e) => {
                    setNewType(e.target.value);
                    if (e.target.value === "TRUE_FALSE") {
                      setNewOptions([{ text: "True", isCorrect: true }, { text: "False", isCorrect: false }]);
                    } else if (e.target.value !== "SHORT_ANSWER") {
                      setNewOptions([
                        { text: "", isCorrect: true }, { text: "", isCorrect: false },
                        { text: "", isCorrect: false }, { text: "", isCorrect: false },
                      ]);
                    }
                  }}>
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  <option value="MULTI_SELECT">Multi Select</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Points</label>
                <input className="admin-search-input" style={{ width: "100%", minWidth: 0 }} type="number" min={1} value={newPoints} onChange={(e) => setNewPoints(parseInt(e.target.value) || 1)} />
              </div>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Question Text</label>
              <textarea className="admin-search-input" style={{ width: "100%", minWidth: 0, minHeight: "60px", resize: "vertical" }} value={newText} onChange={(e) => setNewText(e.target.value)} />
            </div>

            {newType === "SHORT_ANSWER" ? (
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Correct Answer</label>
                <input className="admin-search-input" style={{ width: "100%", minWidth: 0 }} value={newCorrectAnswer} onChange={(e) => setNewCorrectAnswer(e.target.value)} />
              </div>
            ) : (
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>Options (check correct ones)</label>
                {newOptions.map((opt, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                    <input type={newType === "MULTI_SELECT" ? "checkbox" : "radio"} name="correctOpt" checked={opt.isCorrect}
                      onChange={() => {
                        if (newType === "MULTI_SELECT") {
                          const u = [...newOptions]; u[i].isCorrect = !u[i].isCorrect; setNewOptions(u);
                        } else {
                          setNewOptions(newOptions.map((o, j) => ({ ...o, isCorrect: j === i })));
                        }
                      }}
                      style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }} />
                    <input className="admin-search-input" style={{ flex: 1, minWidth: 0 }} value={opt.text}
                      onChange={(e) => { const u = [...newOptions]; u[i].text = e.target.value; setNewOptions(u); }}
                      placeholder={`Option ${i + 1}`} disabled={newType === "TRUE_FALSE"} />
                    {newType !== "TRUE_FALSE" && newOptions.length > 2 && (
                      <button onClick={() => setNewOptions(newOptions.filter((_, j) => j !== i))}
                        style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}>✕</button>
                    )}
                  </div>
                ))}
                {newType !== "TRUE_FALSE" && (
                  <button onClick={() => setNewOptions([...newOptions, { text: "", isCorrect: false }])}
                    style={{ background: "none", border: "1px dashed rgba(79,70,229,0.3)", color: "var(--primary)", padding: "6px 12px", borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer" }}>
                    + Add Option
                  </button>
                )}
              </div>
            )}

            <button className="btn-primary" style={{ padding: "10px 24px", fontSize: "0.9rem" }} onClick={handleAddQuestion} disabled={saving || !newText.trim()}>
              {saving ? "Adding..." : "Add Question"}
            </button>
          </div>
        )}

        {/* Questions List */}
        {questionsList.map((q, i) => (
          <div key={q.id} style={{
            border: "1px solid rgba(63,63,70,0.3)", borderRadius: "12px",
            padding: "1rem 1.25rem", marginBottom: "0.75rem", background: "rgba(255,255,255,0.85)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Q{i + 1} • {q.type.replace("_", " ")} • {q.points} pts
              </span>
              <button onClick={() => handleDeleteQuestion(q.id)}
                style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem" }}>🗑️</button>
            </div>
            <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.5rem" }}>{q.questionText}</div>
            {q.options && (
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {q.options.map((o, j) => (
                  <div key={j} style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.2rem 0" }}>
                    <span>{o.isCorrect ? "✅" : "○"}</span>
                    <span>{o.text}</span>
                  </div>
                ))}
              </div>
            )}
            {q.correctAnswer && (
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Answer: <span style={{ color: "var(--success)" }}>{q.correctAnswer}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
