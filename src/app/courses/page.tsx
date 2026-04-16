"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import Link from "next/link";

type Course = {
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
  totalVideos: number;
  totalDuration: number;
  totalModules: number;
};

const categories = ["Business", "Programming", "Design", "Audio/Video", "Marketing", "Personal Growth"];
const contentTypes = [
  { value: "ALL", label: "Semua Format" },
  { value: "EBOOK", label: "Ebook" },
  { value: "VIDEO", label: "Video Course" },
  { value: "VOICE", label: "Voice / SFX" },
];

const upcomingWebinars = [
  { date: "28 Apr", title: "Live Webinar: AI for UMKM", speaker: "Coach Rani", cta: "Save Seat", href: "/courses/live-webinar-ai-for-umkm-webinar" },
  { date: "05 Mei", title: "Workshop: Personal Branding", speaker: "Dimas F", cta: "Join Waitlist", href: "/courses/workshop-personal-branding-webinar" },
];

const premiumVideos = [
  { title: "Mentoring Rekaman: Closing Sales", price: "Rp149.000", note: "Akses terpisah, tidak termasuk paket 29rb", cta: "Lihat Detail", href: "/courses/mentoring-rekaman-closing-sales-premium" },
  { title: "Deep Dive Ads Optimization", price: "Rp199.000", note: "Akses terpisah, tidak termasuk paket 29rb", cta: "Lihat Detail", href: "/courses/deep-dive-ads-optimization-premium" },
];

type SidebarItem = {
  id: string;
  section: "WEBINAR" | "PREMIUM_VIDEO";
  title: string;
  subtitle: string | null;
  dateLabel: string | null;
  ctaLabel: string | null;
  href: string | null;
  priceLabel: string | null;
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function CatalogPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeContentType, setActiveContentType] = useState<string>("ALL");
  const [webinars, setWebinars] = useState<SidebarItem[]>([]);
  const [premiumItems, setPremiumItems] = useState<SidebarItem[]>([]);

  useEffect(() => {
    async function fetchCourses() {
      setError("");
      try {
        const params = new URLSearchParams();
        if (activeCategory) params.set("category", activeCategory);
        const res = await fetch(`/api/courses?${params}`);
        if (res.ok) {
          const data = await res.json();
          setCourses(data);
        } else {
          const data = await res.json();
          setError(data.error || "Failed to load courses.");
        }
      } catch (fetchError) {
        console.error("Failed to fetch courses:", fetchError);
        setError("Failed to load courses.");
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, [activeCategory]);

  useEffect(() => {
    async function fetchSidebarItems() {
      try {
        const res = await fetch("/api/sidebar-items");
        if (!res.ok) return;
        const data = await res.json();
        setWebinars(data.webinars || []);
        setPremiumItems(data.premiumVideos || []);
      } catch {
        // Keep static fallback
      }
    }
    fetchSidebarItems();
  }, []);

  const getCourseContentType = (course: Course): "EBOOK" | "VIDEO" | "VOICE" => {
    const raw = `${course.category} ${course.title}`.toLowerCase();
    if (raw.includes("ebook") || raw.includes("book")) return "EBOOK";
    if (raw.includes("voice") || raw.includes("audio") || raw.includes("sfx")) return "VOICE";
    if (raw.includes("video") || raw.includes("webinar") || raw.includes("course")) return "VIDEO";
    return course.totalVideos > 0 ? "VIDEO" : "EBOOK";
  };

  const filteredCourses =
    activeContentType === "ALL"
      ? courses
      : courses.filter((course) => getCourseContentType(course) === activeContentType);
  const visibleCourses = filteredCourses.filter((course) => Number(course.price || 0) <= 0);

  const getContentIcon = (contentType: "EBOOK" | "VIDEO" | "VOICE") => {
    if (contentType === "EBOOK") return "📘";
    if (contentType === "VOICE") return "🎧";
    return "🎬";
  };

  return (
    <div className={styles.catalogLayout}>
      {/* Left Sidebar */}
      <aside className={styles.leftSidebar}>
        <div className={styles.leftSidebarInner}>
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>Content Type</h3>
            <div className={styles.categoryList}>
              {contentTypes.map((type) => (
                <div
                  key={type.value}
                  className={`${styles.categoryItem} ${activeContentType === type.value ? styles.active : ""}`}
                  onClick={() => setActiveContentType(type.value)}
                >
                  {type.label}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>Categories</h3>
            <div className={styles.categoryList}>
              <div
                className={`${styles.categoryItem} ${!activeCategory ? styles.active : ""}`}
                onClick={() => setActiveCategory(null)}
              >
                All Courses
              </div>
              {categories.map((cat) => (
                <div
                  key={cat}
                  className={`${styles.categoryItem} ${activeCategory === cat ? styles.active : ""}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Catalog */}
      <main className={styles.mainCatalog}>
        <div className={styles.catalogHeader}>
          <h1 className={styles.catalogTitle}>Course Library</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
            {loading ? "Loading..." : `${visibleCourses.length} konten tersedia`}
          </p>
          {error && (
            <p style={{ color: "var(--danger)", marginTop: "0.5rem", fontSize: "0.9rem" }}>
              {error}
            </p>
          )}
        </div>

        <div className={styles.assetGrid}>
          {loading ? (
            <div style={{ padding: "4rem 0", color: "var(--text-muted)", gridColumn: "1/-1", textAlign: "center" }}>
              Loading courses...
            </div>
          ) : visibleCourses.length === 0 ? (
            <div style={{ padding: "4rem 0", color: "var(--text-muted)", gridColumn: "1/-1", textAlign: "center" }}>
              No courses found matching your filters.
            </div>
          ) : (
            visibleCourses.map(course => {
              const contentType = getCourseContentType(course);
              return (
              <Link
                href={`/courses/${course.slug}`}
                key={course.id}
                className={styles.assetCard}
              >
                <div className={styles.assetThumbnail}>
                  {getContentIcon(contentType)}
                </div>
                <div className={styles.assetInfo}>
                  <div className={styles.assetType}>
                    {contentType}
                    <span style={{ marginLeft: "auto", fontSize: "0.75rem", opacity: 0.7 }}>
                      {course.level}
                    </span>
                  </div>
                  <div className={styles.assetName}>{course.title}</div>
                  <div className={styles.assetMeta}>
                    <span>{course.totalModules} Modules • {course.totalVideos} Videos</span>
                    <span>{formatDuration(course.totalDuration)}</span>
                  </div>
                  <div
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "var(--success)",
                    }}
                  >
                    Included in your one-time access
                  </div>
                </div>
              </Link>
            )})
          )}
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className={styles.rightSidebar}>
        <div className={styles.rightSidebarInner}>
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>Upcoming Webinar</h3>
            <div className={styles.webinarList}>
              {(webinars.length > 0 ? webinars : upcomingWebinars).map((webinar) => {
                const dateLabel = "id" in webinar ? webinar.dateLabel : webinar.date;
                const subtitle = "id" in webinar ? webinar.subtitle : webinar.speaker;
                const ctaLabel = "id" in webinar ? webinar.ctaLabel : webinar.cta;
                const href = "id" in webinar ? webinar.href : webinar.href;
                const targetHref = href || "/courses/live-webinar-ai-for-umkm-webinar";

                return (
                  <Link key={webinar.title} href={targetHref} className={styles.webinarCardLink}>
                    <div className={styles.webinarCard}>
                      <div className={styles.webinarDate}>📅 {dateLabel || "Soon"}</div>
                      <div className={styles.webinarTitle}>{webinar.title}</div>
                      <div className={styles.webinarSpeaker}>{subtitle || "-"}</div>
                      {ctaLabel && <span className={styles.webinarBtn}>{ctaLabel}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>Premium Paid Video</h3>
            <div className={styles.webinarList}>
              {(premiumItems.length > 0 ? premiumItems : premiumVideos).map((item) => {
                const subtitle = "id" in item ? item.subtitle : item.note;
                const price = "id" in item ? item.priceLabel : item.price;
                const href = "id" in item ? item.href : item.href;
                const ctaLabel = "id" in item ? item.ctaLabel : item.cta;
                const targetHref = href || "/courses/mentoring-rekaman-closing-sales-premium";

                return (
                  <Link key={item.title} href={targetHref} className={styles.webinarCardLink}>
                    <div className={styles.webinarCard}>
                      <div className={styles.webinarDate}>💎</div>
                      <div className={styles.webinarTitle}>{item.title}</div>
                      <div className={styles.webinarSpeaker}>{subtitle || "-"}</div>
                      <div className={styles.premiumPrice}>{price || "-"}</div>
                      {ctaLabel && <span className={styles.webinarBtn}>{ctaLabel}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
