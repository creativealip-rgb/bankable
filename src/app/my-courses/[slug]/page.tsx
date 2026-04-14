"use client";

import { useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";

export default function CoursePlayerPage() {
  const [activeVideo, setActiveVideo] = useState(1);
  const [completedVideos, setCompletedVideos] = useState<number[]>([1]); // Video 1 starts completed for demo

  const videos = [
    { id: 1, title: "01. Introduction to Premiere Pro", duration: "15:00", locked: false },
    { id: 2, title: "02. Organizing Your Timelines", duration: "10:30", locked: !completedVideos.includes(1) },
    { id: 3, title: "03. Integrating Voice SFX", duration: "25:00", locked: !completedVideos.includes(2) },
    { id: 4, title: "04. Exporting Like a Pro", duration: "30:00", locked: !completedVideos.includes(3) },
  ];

  const allCompleted = completedVideos.length === videos.length;
  const progressPercent = (completedVideos.length / videos.length) * 100;

  const handleVideoComplete = () => {
    if (!completedVideos.includes(activeVideo)) {
      setCompletedVideos([...completedVideos, activeVideo]);
    }
    // Auto advance to next if available
    const nextVideo = activeVideo + 1;
    if (nextVideo <= videos.length) {
      setActiveVideo(nextVideo);
    }
  };

  return (
    <div className={styles.courseContainer}>
      {/* Main Content Area */}
      <div className={styles.mainContent}>
        <div className={styles.courseHeader}>
          <h1 className={styles.courseTitle}>Video Editing Masterclass</h1>
          <p style={{ color: "var(--text-muted)" }}>Modul 1: The Basics of Video Assembly</p>
        </div>

        <div className={styles.videoWrapper}>
          <div className={styles.videoPlaceholder}>
            <p>Video Player: {videos.find(v => v.id === activeVideo)?.title}</p>
            <div style={{ marginTop: "2rem", textAlign: "center" }}>
              <button 
                className="btn-primary" 
                onClick={handleVideoComplete}
              >
                Simulate Video Watch &ge; 90%
              </button>
            </div>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "1rem" }}>Description</h2>
          <p style={{ color: "var(--text-muted)", lineHeight: "1.8" }}>
            This is the detailed description of the current video. In a real application, 
            this would contain lecture notes, timestamps, download links for the premium Voice SFX bundle discussed, 
            and a discussion section where members can ask questions.
          </p>
        </div>
      </div>

      {/* Sidebar / Progress Area */}
      <div className={styles.sidebar}>
        <div className={styles.moduleHeader}>
          <h3 className={styles.moduleTitle}>Course Progress</h3>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
            <span>{completedVideos.length} / {videos.length} Videos Selesai</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        <ul className={styles.moduleList}>
          {videos.map((video) => (
            <li 
              key={video.id}
              className={`${styles.videoItem} ${activeVideo === video.id ? styles.active : ""} ${video.locked ? styles.locked : ""}`}
              onClick={() => {
                if (!video.locked) setActiveVideo(video.id);
              }}
            >
              <div className={styles.videoIcon}>
                {completedVideos.includes(video.id) ? "✅" : video.locked ? "🔒" : "▶️"}
              </div>
              <div className={styles.videoInfo}>
                <div className={styles.videoTitle}>{video.title}</div>
                <div className={styles.videoDuration}>{video.duration}</div>
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.quizSection}>
          <Link 
            href={allCompleted ? "/my-courses/demo-course/quiz" : "#"} 
            className={`${styles.quizButton} ${allCompleted ? styles.unlocked : styles.locked}`}
            onClick={(e) => {
              if (!allCompleted) e.preventDefault();
            }}
          >
            {allCompleted ? "Take Final Quiz ✨" : "🔒 Quiz Locked"}
          </Link>
          {!allCompleted && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", marginTop: "0.5rem" }}>
              Watch all videos to unlock
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
