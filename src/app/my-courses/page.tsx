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
  const [filter, setFilter] = useState<"all" | "in-progress" | "completed">("all");

  useEffect(() => {
    async function fetchMyCourses() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          setCourses(data.continueLearning || []);
        }
      } catch (error) {
        console.error("Failed to fetch my courses:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMyCourses();
  }, []);

  function getCategoryIcon(category: string): string {
    switch (category) {
      case "Business": return "💼";
      case "Programming": return "💻";
      case "Design": return "🎨";
      case "Audio/Video": return "🎬";
      case "Marketing": return "📈";
      case "Personal Growth": return "🌱";
      default: return "📚";
    }
  }

  const filteredCourses = courses.filter((c) => {
    if (filter === "in-progress") return c.progressPct < 100;
    if (filter === "completed") return c.progressPct >= 100;
    return true;
  });

  if (loading) {
    return (
      <div className={styles.myCoursesContainer}>
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
          Loading your courses...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.myCoursesContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Courses</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Welcome back, {session?.user?.name || "Learner"}! Continue where you left off.
        </p>
      </div>

      <div className={styles.filterTabs}>
        {(["all", "in-progress", "completed"] as const).map((f) => (
          <button
            key={f}
            className={`${styles.filterTab} ${filter === f ? styles.active : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All Courses" : f === "in-progress" ? "In Progress" : "Completed"}
          </button>
        ))}
      </div>

      <div className={styles.courseGrid}>
        {filteredCourses.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📚</div>
            <div className={styles.emptyText}>
              {filter === "completed"
                ? "You haven't completed any courses yet."
                : filter === "in-progress"
                ? "No courses in progress."
                : "You haven't enrolled in any courses yet."}
            </div>
            <Link href="/courses" className="btn-primary">
              Browse Course Catalog
            </Link>
          </div>
        ) : (
          filteredCourses.map((course) => (
            <Link href={`/my-courses/${course.slug}`} key={course.id} className={styles.courseCard}>
              <div className={styles.courseThumb}>
                {getCategoryIcon(course.category)}
                <div className={styles.progressOverlay}>
                  <div
                    className={styles.progressStrike}
                    style={{ width: `${course.progressPct}%` }}
                  />
                </div>
              </div>
              <div className={styles.courseBody}>
                <div className={styles.courseCategory}>{course.category}</div>
                <div className={styles.courseName}>{course.title}</div>
                <div className={styles.courseStats}>
                  <span>
                    {course.completedVideos}/{course.totalVideos} videos
                  </span>
                  {course.progressPct >= 100 ? (
                    <span className={styles.completeBadge}>✅ Complete</span>
                  ) : (
                    <span className={styles.progressText} style={{ color: "var(--primary)" }}>
                      {course.progressPct}%
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
