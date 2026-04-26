"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import styles from "./page.module.css";
import Link from "next/link";

type MyCourse = {
  id: string;
  title: string;
  slug: string;
  category: string;
  completedVideos: number;
  totalVideos: number;
  progressPct: number;
  lastVideo: string;
  lastModule: string;
};

export default function MyCoursesPage() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "in-progress" | "completed">("all");

  useEffect(() => {
    async function fetchMyCourses() {
      setError("");
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          setCourses(data.continueLearning || []);
        } else {
          const data = await res.json();
          setError(data.error || "Gagal memuat kursus Anda.");
        }
      } catch (fetchError) {
        console.error("Gagal mengambil kursus:", fetchError);
        setError("Gagal memuat kursus Anda.");
      } finally {
        setLoading(false);
      }
    }
    fetchMyCourses();
  }, []);

  function getCategoryStyle(category: string): { background: string; icon: string } {
    const map: Record<string, { background: string; icon: string }> = {
      Business:        { background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", icon: "💼" },
      Programming:     { background: "linear-gradient(135deg, #ede9fe, #c4b5fd)", icon: "💻" },
      Design:          { background: "linear-gradient(135deg, #fce7f3, #f9a8d4)", icon: "🎨" },
      "Audio/Video":   { background: "linear-gradient(135deg, #fef3c7, #fcd34d)", icon: "🎬" },
      Marketing:       { background: "linear-gradient(135deg, #d1fae5, #6ee7b7)", icon: "📢" },
      "Personal Growth":{ background: "linear-gradient(135deg, #ffedd5, #fdba74)", icon: "🌱" },
    };
    return map[category] || { background: "linear-gradient(135deg, #ede9fe, #e0e7ff)", icon: "📚" };
  }

  const filteredCourses = courses.filter((c) => {
    if (filter === "in-progress") return c.progressPct < 100;
    if (filter === "completed") return c.progressPct >= 100;
    return true;
  });

  if (loading) {
    return (
      <div className={styles.myCoursesContainer}>
        <div className={styles.loadingState}>Memuat kursus Anda...</div>
      </div>
    );
  }

  return (
    <div className={styles.myCoursesContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Kursus Saya</h1>
        <p className={styles.subtitle}>
          Selamat datang kembali, {session?.user?.name || "Pelajar"}! Lanjutkan belajarmu.
        </p>
        {error && <p className={styles.errorText}>{error}</p>}
      </div>

      <div className={styles.filterTabs}>
        {(["all", "in-progress", "completed"] as const).map((f) => (
          <button
            key={f}
            className={`${styles.filterTab} ${filter === f ? styles.active : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Semua Kursus" : f === "in-progress" ? "Sedang Dipelajari" : "Selesai"}
          </button>
        ))}
      </div>

      <div className={styles.courseGrid}>
        {filteredCourses.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📚</div>
            <div className={styles.emptyText}>
              {filter === "completed"
                ? "Anda belum menyelesaikan kursus apa pun."
                : filter === "in-progress"
                ? "Tidak ada kursus yang sedang dipelajari."
                : "Anda belum terdaftar di kursus apa pun."}
            </div>
            <Link href="/courses" className="btn-primary">
              Lihat Katalog Kursus
            </Link>
          </div>
        ) : (
          filteredCourses.map((course) => (
            <Link href={`/my-courses/${course.slug}`} key={course.id} className={styles.courseCard}>
              <div className={styles.courseThumb} style={{ background: getCategoryStyle(course.category).background }}>
                <span style={{ fontSize: "2.8rem" }}>{getCategoryStyle(course.category).icon}</span>
                <div className={styles.progressOverlay}>
                  <div
                    className={styles.progressStrike}
                    style={{ width: `${course.progressPct}%` }}
                  />
                </div>
              </div>
              <div className={styles.courseBody}>
                <div className={styles.courseTop}>
                  <div className={styles.courseCategory}>{course.category}</div>
                  {course.progressPct >= 100 ? (
                    <span className={styles.completeBadge}>Selesai</span>
                  ) : (
                    <span className={styles.progressText}>{course.progressPct}%</span>
                  )}
                </div>
                <div className={styles.courseName}>{course.title}</div>
                <div className={styles.lastLesson}>
                  {course.lastModule ? `Terakhir: ${course.lastModule}` : "Mulai belajar sekarang"}
                </div>
                <div className={styles.courseStats}>
                  <span>
                    {course.completedVideos}/{course.totalVideos} video
                  </span>
                  <span>progres {Math.max(course.progressPct, 0)}%</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
