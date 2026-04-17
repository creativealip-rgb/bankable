"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import styles from "./page.module.css";
import Link from "next/link";

type DashboardData = {
  stats: {
    coursesInProgress: number;
    coursesCompleted: number;
    certificatesEarned: number;
    totalVideosWatched: number;
  };
  continueLearning: {
    id: string;
    title: string;
    slug: string;
    thumbnail: string | null;
    category: string;
    completedVideos: number;
    totalVideos: number;
    progressPct: number;
    lastVideo: string;
    lastModule: string;
  }[];
  certificates: {
    id: string;
    certificateNumber: string;
    score: string;
    issuedAt: string;
    course: { id: string; title: string; slug: string };
  }[];
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      setError("");
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          setDashboard(data);
        } else {
          const data = await res.json();
          setError(data.error || "Failed to load dashboard.");
        }
      } catch (fetchError) {
        console.error("Failed to fetch dashboard:", fetchError);
        setError("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  const stats = dashboard?.stats;

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Welcome back, {session?.user?.name || "Learner"}!
        </h1>
        <p className={styles.subtitle}>Here is your learning overview.</p>
        <Link href="/payments" className={styles.paymentLink}>
          Cek progres pembayaran &rarr;
        </Link>
        {error && <p className={styles.errorText}>{error}</p>}
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎬</div>
          <div>
            <div className={styles.statValue}>{stats?.coursesInProgress || 0}</div>
            <div className={styles.statLabel}>In Progress</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div>
            <div className={styles.statValue}>{stats?.coursesCompleted || 0}</div>
            <div className={styles.statLabel}>Completed</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🏆</div>
          <div>
            <div className={styles.statValue}>{stats?.certificatesEarned || 0}</div>
            <div className={styles.statLabel}>Certificates</div>
          </div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* Left Column: Progress */}
        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Continue Learning</h2>
            <Link href="/courses" className={styles.sectionLink}>Browse Catalog &rarr;</Link>
          </div>

          {dashboard?.continueLearning && dashboard.continueLearning.length > 0 ? (
            dashboard.continueLearning.map((course) => (
              <Link href={`/my-courses/${course.slug}`} key={course.id} className={styles.courseItem}>
                <div className={styles.courseInfo}>
                  <div className={styles.courseName}>{course.title}</div>
                  <div className={styles.courseMeta}>{course.lastModule} • {course.lastVideo}</div>
                </div>
                <div className={styles.courseProgress}>
                  <span className={styles.progressPct}>{course.progressPct}%</span>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${course.progressPct}%` }}></div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className={styles.emptyState}>
              No courses in progress yet. <Link href="/courses" className={styles.inlineLink}>Start learning!</Link>
            </div>
          )}
        </div>

        {/* Right Column: Certificates */}
        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>My Certificates</h2>
          </div>

          <div className={styles.certGrid}>
            {dashboard?.certificates && dashboard.certificates.length > 0 ? (
              dashboard.certificates.map((cert) => (
                <div key={cert.id} className={styles.certCard}>
                  <div className={styles.certIcon}>🏆</div>
                  <div className={styles.certInfo}>
                    <div className={styles.certTitle}>{cert.course.title}</div>
                    <div className={styles.certMeta}>
                      Score: {parseFloat(cert.score).toFixed(0)}% • {new Date(cert.issuedAt).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}
                    </div>
                    <div className={styles.certNumber}>
                      {cert.certificateNumber}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                No certificates yet. Complete a course to earn one!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
