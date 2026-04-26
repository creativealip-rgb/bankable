"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

type Video = {
  id: string;
  title: string;
  duration: number;
  order: number;
};

type Module = {
  id: string;
  title: string;
  order: number;
  videos: Video[];
};

type Quiz = {
  id: string;
  title: string;
  passingGrade: number;
  timeLimit: number;
  maxAttempts: number;
};

type CourseDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: string;
  category: string;
  level: string;
  thumbnail: string | null;
  price: string | null;
  status: string;
  minWatchPct: number;
  modules: Module[];
  quiz: Quiz[];
  createdBy: { id: string; name: string; image: string | null } | null;
  totalVideos: number;
  totalDuration: number;
  totalModules: number;
  isPaidOffering?: boolean;
  hasPremiumAccess?: boolean;
  hasMainAccess?: boolean;
};

type Review = {
  id: string;
  rating: number;
  review: string | null;
  createdAt: string;
  user: { name: string; image: string | null };
};


function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatPrice(price: string | null): string {
  const value = Number(price || 0);
  return new Intl.NumberFormat("id-ID").format(value);
}

function getLevelStyle(level: string): string {
  switch (level.toUpperCase()) {
    case "BEGINNER": return styles.levelBeginner;
    case "INTERMEDIATE": return styles.levelIntermediate;
    case "ADVANCED": return styles.levelAdvanced;
    default: return styles.levelBeginner;
  }
}

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

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default function CourseDetailPage({ params }: PageProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [slug, setSlug] = useState<string>("");
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [buying, setBuying] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [accessChecked, setAccessChecked] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userRating, setUserRating] = useState(5);
  const [userReview, setUserReview] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);


  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug || isPending) return;

    const role = (session?.user as Record<string, unknown> | undefined)?.role as string | undefined;
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    if (isAdmin) {
      setAccessChecked(true);
      return;
    }

    if (!session) {
      router.replace("/pricing");
      return;
    }

    let cancelled = false;
    async function ensureMainAccess() {
      try {
        const res = await fetch("/api/access/main");
        if (!res.ok) {
          router.replace("/pricing");
          return;
        }
        const data = await res.json();
        if (!data.hasMainAccess) {
          router.replace("/pricing");
          return;
        }
        if (!cancelled) setAccessChecked(true);
      } catch {
        router.replace("/pricing");
      }
    }
    void ensureMainAccess();
    return () => {
      cancelled = true;
    };
  }, [slug, isPending, session, router]);

  useEffect(() => {
    if (!slug || !accessChecked) return;

    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setCourse(data);
          // Expand first module by default
          if (data.modules.length > 0) {
            setExpandedModules(new Set([data.modules[0].id]));
          }
        }
      } catch (error) {
        console.error("Failed to fetch course:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [slug, accessChecked]);

  useEffect(() => {
    if (!slug) return;
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/courses/${slug}/reviews`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data);
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      }
    }
    fetchReviews();
  }, [slug]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingReview || !slug) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/courses/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: userRating, review: userReview }),
      });
      if (res.ok) {
        const data = await res.json();
        setReviews([data, ...reviews]);
        setUserReview("");
        alert("Terima kasih atas ulasan kamu!");
      } else {
        const data = await res.json();
        alert(data.error || "Gagal mengirim ulasan.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mengirim ulasan.");
    } finally {
      setSubmittingReview(false);
    }
  };


  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  if (isPending || !accessChecked || loading) {
    return (
      <div className={styles.detailContainer}>
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)", gridColumn: "1/-1" }}>
          Loading course details...
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.detailContainer}>
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)", gridColumn: "1/-1" }}>
          Course not found.{" "}
          <Link href="/courses" style={{ color: "var(--primary)" }}>
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  const quiz = course.quiz?.[0];
  const isPaidCourse = Boolean(course.isPaidOffering ?? Number(course.price || 0) > 0);
  const hasPremiumAccess = Boolean(course.hasPremiumAccess);
  const hasMainAccess = course.hasMainAccess !== false;
  const hasCourseAccess = isPaidCourse ? hasPremiumAccess : hasMainAccess;

  const handleCheckout = async (mode: "PREMIUM" | "LIFETIME") => {
    if ((mode === "PREMIUM" && !isPaidCourse) || buying) return;
    setCheckoutError("");

    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/courses/${course.slug}`)}`);
      return;
    }

    setBuying(true);
    try {
      const endpoint = mode === "PREMIUM" ? "/api/payments/premium-checkout" : "/api/payments/checkout";
      const payload = mode === "PREMIUM" ? { courseSlug: course.slug } : { tier: "LIFETIME" };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }
      if (!data.paymentId) {
        throw new Error("Payment reference tidak tersedia.");
      }
      router.push(`/payments/${data.paymentId}`);
      if (data.mode === "MANUAL") {
        return;
      }
    } catch (error) {
      console.error(error);
      setCheckoutError(error instanceof Error ? error.message : "Gagal membuat checkout. Coba lagi.");
    } finally {
      setBuying(false);
    }
  };

  const handleShare = (platform: "WA" | "COPY") => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `Belajar "${course?.title}" di BELAJARIA seru banget! Cek di sini: ${url}`;
    
    if (platform === "WA") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    } else {
      navigator.clipboard.writeText(url);
      alert("Link berhasil disalin ke clipboard!");
    }
  };

  return (
    <div className={styles.detailContainer}>
      {/* Main Column */}
      <div className={styles.mainColumn}>
        <Link href="/courses" className={styles.backLink}>
          ← Kembali ke Katalog
        </Link>

        {/* Hero / Thumbnail */}
        <div className={styles.heroSection}>
          <div className={styles.heroThumbnail}>
            <span className={styles.heroIcon}>{getCategoryIcon(course.category)}</span>
            <div className={styles.heroOverlay}>
              <div
                className={`${styles.courseType} ${
                  course.type === "SINGLE" ? styles.typeSingle : styles.typeMulti
                }`}
              >
                {course.type === "SINGLE" ? "Single Video" : "Multi Video Series"}
              </div>
              <h1 className={styles.courseTitle}>{course.title}</h1>
              <div className={styles.courseMeta}>
                <span className={styles.metaItem}>
                  🎬 {course.totalVideos} {course.totalVideos === 1 ? "Video" : "Videos"}
                </span>
                <span className={styles.metaItem}>⏱️ {formatDuration(course.totalDuration)}</span>
                <span className={styles.metaItem}>📂 {course.totalModules} Modules</span>
                <span className={`${styles.levelBadge} ${getLevelStyle(course.level)}`}>
                  {course.level}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className={styles.descSection}>
          <h2 className={styles.descTitle}>Tentang Kursus Ini</h2>
          <p className={styles.descText}>
            {course.description || "Belum ada deskripsi untuk kursus ini. Cek kembali nanti untuk pembaruan!"}
          </p>
        </div>

        {/* Curriculum */}
        <div className={styles.curriculumSection}>
          <div className={styles.curriculumTitle}>
            <span>Kurikulum</span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 400 }}>
              {course.totalModules} modul • {course.totalVideos} materi
            </span>
          </div>

          {course.modules.map((mod) => {
            const isExpanded = expandedModules.has(mod.id);
            const moduleDuration = mod.videos.reduce((sum, v) => sum + v.duration, 0);

            return (
              <div key={mod.id} className={styles.moduleCard}>
                <div className={styles.moduleHeader} onClick={() => toggleModule(mod.id)}>
                  <span className={styles.moduleName}>
                    {isExpanded ? "▾" : "▸"} {mod.title}
                  </span>
                  <span className={styles.moduleStats}>
                    {mod.videos.length} materi • {formatDuration(moduleDuration)}
                  </span>
                </div>
                {isExpanded && (
                  <ul className={styles.videoList}>
                    {mod.videos.map((video, index) => (
                      <li key={video.id} className={styles.videoPreviewItem}>
                        <span className={styles.videoPreviewIcon}>
                          {index === 0 ? "▶️" : "🔒"}
                        </span>
                        <span className={styles.videoPreviewTitle}>{video.title}</span>
                        <span className={styles.videoPreviewDuration}>
                          {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, "0")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* Reviews Section */}
        <div className={styles.reviewsSection}>
          <h2 className={styles.descTitle}>Ulasan Alumni</h2>
          
          {hasCourseAccess && (
            <div className={styles.reviewForm}>
              <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Berikan Ulasan Kamu</h3>
              <form onSubmit={handleSubmitReview}>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: star <= userRating ? "#f59e0b" : "#cbd5e1" }}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  value={userReview}
                  onChange={(e) => setUserReview(e.target.value)}
                  placeholder="Ceritakan pengalaman belajar kamu di kursus ini..."
                  className={styles.reviewTextarea}
                />
                <button type="submit" className="btn-primary" disabled={submittingReview} style={{ marginTop: "0.5rem" }}>
                  {submittingReview ? "Mengirim..." : "Kirim Ulasan"}
                </button>
              </form>
            </div>
          )}

          <div className={styles.reviewsList}>
            {reviews.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Belum ada ulasan untuk kursus ini.</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className={styles.reviewItem}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div className={styles.reviewAvatar}>
                        {r.user.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{r.user.name}</span>
                    </div>
                    <span style={{ color: "#f59e0b", fontWeight: 700 }}>{"★".repeat(r.rating)}</span>
                  </div>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-main)", lineHeight: 1.5 }}>{r.review}</p>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                    {new Date(r.createdAt).toLocaleDateString("id-ID")}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>


      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarInner}>
          {/* Enroll Card */}
          <div className={styles.enrollCard}>
            <div className={`${styles.priceTag} ${isPaidCourse ? styles.pricePaid : styles.priceFree}`}>
              {isPaidCourse ? `Rp${formatPrice(course.price)}` : "Included"}
            </div>
            <p className={styles.priceSubtext}>
              {isPaidCourse
                ? hasPremiumAccess
                  ? "Akses premium kamu sudah aktif untuk konten ini."
                  : "Konten premium berbayar terpisah dari paket one-time access."
                : hasMainAccess
                  ? "Akses penuh sudah termasuk dalam pembelian sekali bayar."
                  : "Akses konten ini membutuhkan aktivasi one-time access terlebih dulu."}
            </p>
            {checkoutError ? (
              <p className={styles.checkoutError} role="alert">
                {checkoutError}
              </p>
            ) : null}
            {isPaidCourse && !hasPremiumAccess ? (
              <button
                type="button"
                onClick={() => handleCheckout("PREMIUM")}
                className={styles.enrollBtn}
                style={{ width: "100%" }}
                disabled={buying}
              >
                {buying ? "Memproses..." : "Beli Akses Premium"}
              </button>
            ) : !isPaidCourse && !hasMainAccess ? (
              <button
                type="button"
                onClick={() => handleCheckout("LIFETIME")}
                className={styles.enrollBtn}
                style={{ width: "100%" }}
                disabled={buying}
              >
                {buying ? "Memproses..." : "Aktifkan Akses Member"}
              </button>
            ) : (
              <Link
                href={`/my-courses/${course.slug}`}
                className={styles.enrollBtn}
                style={{ display: "block", textDecoration: "none" }}
              >
                Mulai Belajar Sekarang
              </Link>
            )}
            <ul className={styles.courseInfoList}>
              <li className={styles.courseInfoItem}>
                <span className={styles.courseInfoIcon}>🎬</span>
                <span>{course.totalVideos} materi video</span>
              </li>
              <li className={styles.courseInfoItem}>
                <span className={styles.courseInfoIcon}>⏱️</span>
                <span>Total durasi {formatDuration(course.totalDuration)}</span>
              </li>
              <li className={styles.courseInfoItem}>
                <span className={styles.courseInfoIcon}>📊</span>
                <span>Level {course.level}</span>
              </li>
              <li className={styles.courseInfoItem}>
                <span className={styles.courseInfoIcon}>📝</span>
                <span>{quiz ? "Kuis & Sertifikat tersedia" : "Tidak ada kuis"}</span>
              </li>
              <li className={styles.courseInfoItem}>
                <span className={styles.courseInfoIcon}>♾️</span>
                <span>Akses selamanya</span>
              </li>
            </ul>

            <div className={styles.shareSection}>
              <p className={styles.shareLabel}>Bagikan kursus ini:</p>
              <div className={styles.shareBtns}>
                <button onClick={() => handleShare("WA")} className={styles.shareBtnWa}>
                  WhatsApp
                </button>
                <button onClick={() => handleShare("COPY")} className={styles.shareBtnCopy}>
                  Salin Link
                </button>
              </div>
            </div>
          </div>

          {/* Quiz Info */}
          {quiz && (
            <div className={styles.quizInfoCard}>
              <div className={styles.quizInfoTitle}>📝 Final Quiz</div>
              <div className={styles.quizInfoItem}>
                <span>Passing Grade</span>
                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{quiz.passingGrade}%</span>
              </div>
              <div className={styles.quizInfoItem}>
                <span>Time Limit</span>
                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{quiz.timeLimit} min</span>
              </div>
              <div className={styles.quizInfoItem}>
                <span>Max Attempts</span>
                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{quiz.maxAttempts}</span>
              </div>
            </div>
          )}

          {/* Instructor */}
          {course.createdBy && (
            <div className={styles.instructorCard}>
              <div className={styles.instructorAvatar}>
                {course.createdBy.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div>
                <div className={styles.instructorName}>{course.createdBy.name}</div>
                <div className={styles.instructorRole}>Instructor</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
