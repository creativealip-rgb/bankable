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

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatPrice(price: string | null): string {
  if (!price || price === "0") return "Free";
  return `Rp ${parseInt(price).toLocaleString("id-ID")}`;
}

export default function CatalogPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const params = new URLSearchParams();
        if (activeCategory) params.set("category", activeCategory);
        const res = await fetch(`/api/courses?${params}`);
        if (res.ok) {
          const data = await res.json();
          setCourses(data);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, [activeCategory]);

  return (
    <div className={styles.catalogLayout}>
      {/* Left Sidebar - Categories */}
      <aside className={styles.leftSidebar}>
        <h3 className={styles.sidebarTitle}>Categories</h3>
        <div className={styles.categoryList}>
          <div
            className={`${styles.categoryItem} ${!activeCategory ? styles.active : ""}`}
            onClick={() => setActiveCategory(null)}
          >
            All Courses
          </div>
          {categories.map(cat => (
            <div
              key={cat}
              className={`${styles.categoryItem} ${activeCategory === cat ? styles.active : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Catalog */}
      <main className={styles.mainCatalog}>
        <div className={styles.catalogHeader}>
          <h1 className={styles.catalogTitle}>Course Library</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
            {loading ? "Loading..." : `${courses.length} courses available`}
          </p>
        </div>

        <div className={styles.assetGrid}>
          {loading ? (
            <div style={{ padding: "4rem 0", color: "var(--text-muted)", gridColumn: "1/-1", textAlign: "center" }}>
              Loading courses...
            </div>
          ) : courses.length === 0 ? (
            <div style={{ padding: "4rem 0", color: "var(--text-muted)", gridColumn: "1/-1", textAlign: "center" }}>
              No courses found matching your filters.
            </div>
          ) : (
            courses.map(course => (
              <Link
                href={`/my-courses/${course.slug}`}
                key={course.id}
                className={styles.assetCard}
              >
                <div className={styles.assetThumbnail}>
                  {course.category === "Business" ? "💼" :
                   course.category === "Programming" ? "💻" :
                   course.category === "Design" ? "🎨" : "🎬"}
                </div>
                <div className={styles.assetInfo}>
                  <div className={styles.assetType}>
                    {course.type === "SINGLE" ? "Single Video" : "Multi Video"}
                    <span style={{ marginLeft: "auto", fontSize: "0.75rem", opacity: 0.7 }}>
                      {course.level}
                    </span>
                  </div>
                  <div className={styles.assetName}>{course.title}</div>
                  <div className={styles.assetMeta}>
                    <span>{course.totalModules} Modules • {course.totalVideos} Videos</span>
                    <span>{formatDuration(course.totalDuration)}</span>
                  </div>
                  <div style={{
                    marginTop: "0.5rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: course.price === "0" || !course.price ? "var(--success)" : "var(--primary)"
                  }}>
                    {formatPrice(course.price)}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className={styles.rightSidebar}>
        <h3 className={styles.sidebarTitle}>Quick Stats</h3>
        <div className={styles.webinarList}>
          <div className={styles.webinarCard}>
            <div className={styles.webinarDate}>📚</div>
            <div className={styles.webinarTitle}>{courses.length} Total Courses</div>
            <div className={styles.webinarSpeaker}>across all categories</div>
          </div>
          <div className={styles.webinarCard}>
            <div className={styles.webinarDate}>🎬</div>
            <div className={styles.webinarTitle}>
              {courses.reduce((sum, c) => sum + c.totalVideos, 0)} Videos
            </div>
            <div className={styles.webinarSpeaker}>
              {formatDuration(courses.reduce((sum, c) => sum + c.totalDuration, 0))} total
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
