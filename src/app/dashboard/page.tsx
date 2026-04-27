"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import styles from "./page.module.css";
import Link from "next/link";
import Skeleton from "@/components/Skeleton";

type DashboardData = {
  stats: {
    coursesInProgress: number;
    coursesCompleted: number;
    certificatesEarned: number;
    totalVideosWatched: number;
  };
  user?: {
    xp: number;
    level: number;
    currentStreak: number;
    lastLearningDate: string | null;
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
          setError(data.error || "Gagal memuat dashboard.");
        }
      } catch (fetchError) {
        console.error("Gagal mengambil dashboard:", fetchError);
        setError("Gagal memuat dashboard.");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const getLevelInfo = (level: number) => {
    if (level >= 10) return { name: "Maestro", color: "#f59e0b", icon: "💎" };
    if (level >= 5) return { name: "Cendekiawan", color: "#818cf8", icon: "🎓" };
    if (level >= 2) return { name: "Pelajar Aktif", color: "#10b981", icon: "🌱" };
    return { name: "Pemula", color: "#94a3b8", icon: "🥚" };
  };

  const levelInfo = getLevelInfo(dashboard?.user?.level || 1);
  const xpInLevel = (dashboard?.user?.xp || 0) % 1000;
  const xpProgress = Math.round((xpInLevel / 1000) * 100);

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.header}>
          <Skeleton width="40%" height="2.5rem" />
          <Skeleton width="20%" height="1.2rem" style={{ marginTop: "1rem" }} />
        </div>
        <div className={styles.statsGrid}>
          <Skeleton height="80px" />
          <Skeleton height="80px" />
          <Skeleton height="80px" />
        </div>
        <div className={styles.contentGrid} style={{ marginTop: "2rem" }}>
          <Skeleton height="300px" />
          <Skeleton height="300px" />
        </div>
      </div>
    );
  }

  const stats = dashboard?.stats;

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Selamat datang kembali, {session?.user?.name || "Pelajar"}!
        </h1>
        <div className={styles.levelBadge} style={{ borderColor: levelInfo.color, color: levelInfo.color }}>
          <span className={styles.levelIcon}>{levelInfo.icon}</span>
          Level {dashboard?.user?.level || 1}: {levelInfo.name}
        </div>
        <div className={styles.xpTracker}>
          <div className={styles.xpLabel}>
            <span>{xpInLevel} / 1000 XP</span>
            <span>Next Level</span>
          </div>
          <div className={styles.xpBar}>
            <div className={styles.xpFill} style={{ width: `${xpProgress}%`, background: levelInfo.color }}></div>
          </div>
        </div>
        {error && <p className={styles.errorText}>{error}</p>}
      </div>

      {dashboard?.continueLearning && dashboard.continueLearning.length > 0 && (
        <div className={styles.resumeHero}>
          <div className={styles.resumeContent}>
            <span className={styles.resumeBadge}>Lanjutkan Belajar</span>
            <h2 className={styles.resumeTitle}>{dashboard.continueLearning[0].title}</h2>
            <p className={styles.resumeModule}>
              Terakhir: {dashboard.continueLearning[0].lastModule}
            </p>
            <div className={styles.resumeProgressRow}>
              <div className={styles.resumeProgressBar}>
                <div 
                  className={styles.resumeProgressFill} 
                  style={{ width: `${dashboard.continueLearning[0].progressPct}%` }}
                ></div>
              </div>
              <span className={styles.resumePct}>{dashboard.continueLearning[0].progressPct}%</span>
            </div>
            <Link 
              href={`/my-courses/${dashboard.continueLearning[0].slug}`} 
              className="btn-primary"
              style={{ alignSelf: "flex-start", marginTop: "0.5rem" }}
            >
              Lanjutkan Sekarang &rarr;
            </Link>
          </div>
          <div className={styles.resumeVisual}>
            🎬
          </div>
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎬</div>
          <div>
            <div className={styles.statValue}>{stats?.coursesInProgress || 0}</div>
            <div className={styles.statLabel}>Sedang Dipelajari</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div>
            <div className={styles.statValue}>{stats?.coursesCompleted || 0}</div>
            <div className={styles.statLabel}>Selesai</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🏆</div>
          <div>
            <div className={styles.statValue}>{stats?.certificatesEarned || 0}</div>
            <div className={styles.statLabel}>Sertifikat</div>
          </div>
        </div>
        <div className={styles.statCard} style={{ background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)", color: "white" }}>
          <div className={styles.statIcon} style={{ fontSize: "2rem" }}>🔥</div>
          <div>
            <div className={styles.statValue} style={{ color: "white" }}>{dashboard?.user?.currentStreak || 0} Hari</div>
            <div className={styles.statLabel} style={{ color: "rgba(255,255,255,0.9)" }}>Learning Streak</div>
          </div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* Left Column: Progress */}
        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Lanjutkan Belajar</h2>
            <Link href="/courses" className={styles.sectionLink}>Lihat Katalog &rarr;</Link>
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
            <div className={styles.emptyContainer}>
              <div className={styles.emptyIcon}>🎓</div>
              <p className={styles.emptyText}>Belum ada kursus yang sedang dipelajari.</p>
              <Link href="/courses" className="btn-secondary" style={{ marginTop: "1rem" }}>Mulai belajar!</Link>
            </div>
          )}
        </div>

        {/* Right Column: Certificates */}
        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Sertifikat Saya</h2>
          </div>

          <div className={styles.certGrid}>
            {dashboard?.certificates && dashboard.certificates.length > 0 ? (
              dashboard.certificates.map((cert) => (
                <div key={cert.id} className={styles.certCard}>
                  <div className={styles.certIcon}>🏆</div>
                  <div className={styles.certInfo}>
                    <div className={styles.certTitle}>{cert.course.title}</div>
                    <div className={styles.certMeta}>
                      Skor: {parseFloat(cert.score).toFixed(0)}% • {new Date(cert.issuedAt).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}
                    </div>
                    <div className={styles.certNumber}>
                      {cert.certificateNumber}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyContainer} style={{ padding: "2rem 1rem" }}>
                <div className={styles.emptyIcon} style={{ fontSize: "2rem" }}>📜</div>
                <p className={styles.emptyText}>Belum ada sertifikat. Selesaikan kursus untuk mendapatkannya!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
