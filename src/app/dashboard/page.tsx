"use client";

import styles from "./page.module.css";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Welcome back, Creator!</h1>
        <p style={{ color: "var(--text-muted)" }}>Here is your learning and download overview.</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎬</div>
          <div>
            <div className={styles.statValue}>12</div>
            <div className={styles.statLabel}>Courses In Progress</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📚</div>
          <div>
            <div className={styles.statValue}>45</div>
            <div className={styles.statLabel}>Ebooks Read</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎶</div>
          <div>
            <div className={styles.statValue}>89</div>
            <div className={styles.statLabel}>SFX Downloaded</div>
          </div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* Left Column: Progress */}
        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Continue Learning</h2>
            <Link href="/courses" style={{ color: "var(--primary)", fontSize: "0.9rem" }}>Browse Catalog &rarr;</Link>
          </div>
          
          <div className={styles.courseItem}>
            <div className={styles.courseInfo}>
              <div className={styles.courseName}>Video Editing Masterclass</div>
              <div className={styles.courseMeta}>Video Course • Modul 1: The Basics</div>
            </div>
            <div className={styles.courseProgress}>
              <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>25%</span>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: "25%" }}></div>
              </div>
            </div>
          </div>
          
          <div className={styles.courseItem}>
            <div className={styles.courseInfo}>
              <div className={styles.courseName}>Advanced Color Grading</div>
              <div className={styles.courseMeta}>Video Course • Lesson 4</div>
            </div>
            <div className={styles.courseProgress}>
              <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>60%</span>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: "60%" }}></div>
              </div>
            </div>
          </div>
          
          <div className={styles.courseItem}>
            <div className={styles.courseInfo}>
              <div className={styles.courseName}>Cinematic Lighting Guide</div>
              <div className={styles.courseMeta}>Ebook • Page 42/120</div>
            </div>
            <div className={styles.courseProgress}>
              <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>35%</span>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: "35%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Certificates */}
        <div className={styles.sectionBox}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>My Certificates</h2>
          </div>
          
          <div className={styles.certGrid}>
            <div className={styles.certCard}>
              <div className={styles.certIcon}>🏆</div>
              <div>
                <div style={{ fontWeight: 500, fontSize: "0.95rem" }}>Premiere Pro Basics</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Issued: Oct 2025</div>
              </div>
            </div>
            
            <div className={styles.certCard}>
              <div className={styles.certIcon}>🏆</div>
              <div>
                <div style={{ fontWeight: 500, fontSize: "0.95rem" }}>Sound Design 101</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Issued: Sep 2025</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
