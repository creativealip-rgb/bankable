"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./page.module.css";
import Link from "next/link";

type Video = {
  id: string;
  title: string;
  url: string | null;
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

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: string;
  minWatchPct: number;
  modules: Module[];
  quiz: Quiz[];
  totalVideos: number;
  totalDuration: number;
};

type VideoProgress = {
  watchedPct: string;
  lastPosition: number;
  isCompleted: boolean;
};

type ProgressData = {
  totalVideos: number;
  completedVideos: number;
  overallProgress: number;
  videoProgress: Record<string, VideoProgress>;
};

// Use the dynamic route parameter
type PageProps = {
  params: Promise<{ slug: string }>;
};

export default function CoursePlayerPage({ params }: PageProps) {
  const [slug, setSlug] = useState<string>("");
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolve the params promise
  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  // Fetch course data and progress
  useEffect(() => {
    if (!slug) return;

    async function fetchData() {
      try {
        const [courseRes, progressRes] = await Promise.all([
          fetch(`/api/courses/${slug}`),
          fetch(`/api/progress?courseSlug=${slug}`),
        ]);

        if (courseRes.ok) {
          const courseData = await courseRes.json();
          setCourse(courseData);

          // Set active video to first unwatched or first video
          const allVideos = courseData.modules.flatMap((m: Module) => m.videos);
          if (allVideos.length > 0) {
            if (progressRes.ok) {
              const progressData = await progressRes.json();
              setProgress(progressData);

              // Find first incomplete video
              const firstIncomplete = allVideos.find(
                (v: Video) => !progressData.videoProgress[v.id]?.isCompleted
              );
              setActiveVideoId(firstIncomplete?.id || allVideos[0].id);
            } else {
              setActiveVideoId(allVideos[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load course:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  // Get flat list of all videos in order
  const allVideos = course?.modules.flatMap((m) => m.videos) || [];

  // Check if a video is accessible (sequential unlock)
  const isVideoAccessible = useCallback((video: Video): boolean => {
    if (!progress || !course) return video === allVideos[0]; // first video always accessible

    const videoIndex = allVideos.findIndex((v) => v.id === video.id);
    if (videoIndex === 0) return true;

    // Previous video must be completed
    const prevVideo = allVideos[videoIndex - 1];
    return progress.videoProgress[prevVideo.id]?.isCompleted || false;
  }, [progress, course, allVideos]);

  // Get active video info
  const activeVideo = allVideos.find((v) => v.id === activeVideoId);
  const activeModule = course?.modules.find((m) =>
    m.videos.some((v) => v.id === activeVideoId)
  );

  // Simulate watching video (in real app, this would track actual video playback)
  const handleSimulateWatch = async () => {
    if (!activeVideoId) return;

    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: activeVideoId,
          watchedPct: "95",
          lastPosition: activeVideo?.duration || 0,
        }),
      });

      if (res.ok) {
        // Refresh progress
        const progressRes = await fetch(`/api/progress?courseSlug=${slug}`);
        if (progressRes.ok) {
          const newProgress = await progressRes.json();
          setProgress(newProgress);

          // Auto-advance to next video
          const currentIndex = allVideos.findIndex((v) => v.id === activeVideoId);
          if (currentIndex < allVideos.length - 1) {
            setActiveVideoId(allVideos[currentIndex + 1].id);
          }
        }
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  };

  const allCompleted = progress
    ? progress.completedVideos >= progress.totalVideos
    : false;

  const quizId = course?.quiz?.[0]?.id;

  if (loading) {
    return (
      <div className={styles.courseContainer}>
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
          Loading course...
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.courseContainer}>
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
          Course not found. <Link href="/courses" style={{ color: "var(--primary)" }}>Back to courses</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.courseContainer}>
      {/* Main Content Area */}
      <div className={styles.mainContent}>
        <div className={styles.courseHeader}>
          <h1 className={styles.courseTitle}>{course.title}</h1>
          <p style={{ color: "var(--text-muted)" }}>
            {activeModule?.title} — {activeVideo?.title}
          </p>
        </div>

        <div className={styles.videoWrapper}>
          <div className={styles.videoPlaceholder}>
            {activeVideo?.url ? (
              <p>🎬 Video: {activeVideo.title}</p>
            ) : (
              <p>No video URL configured</p>
            )}
            <div style={{ marginTop: "2rem", textAlign: "center" }}>
              <button
                className="btn-primary"
                onClick={handleSimulateWatch}
                disabled={!activeVideoId || !isVideoAccessible(activeVideo!)}
              >
                Simulate Watch ≥ 90%
              </button>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "2rem" }}>
          <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "1rem" }}>Description</h2>
          <p style={{ color: "var(--text-muted)", lineHeight: "1.8" }}>
            {course.description || "No description available."}
          </p>
        </div>
      </div>

      {/* Sidebar / Progress Area */}
      <div className={styles.sidebar}>
        <div className={styles.moduleHeader}>
          <h3 className={styles.moduleTitle}>Course Progress</h3>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
            <span>{progress?.completedVideos || 0} / {progress?.totalVideos || allVideos.length} Videos</span>
            <span>{progress?.overallProgress || 0}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress?.overallProgress || 0}%` }}></div>
          </div>
        </div>

        <ul className={styles.moduleList}>
          {course.modules.map((mod) => (
            <li key={mod.id} style={{ marginBottom: "0.5rem" }}>
              <div style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {mod.title}
              </div>
              {mod.videos.map((video) => {
                const vp = progress?.videoProgress[video.id];
                const accessible = isVideoAccessible(video);
                const completed = vp?.isCompleted;

                return (
                  <li
                    key={video.id}
                    className={`${styles.videoItem} ${activeVideoId === video.id ? styles.active : ""} ${!accessible ? styles.locked : ""}`}
                    onClick={() => {
                      if (accessible) setActiveVideoId(video.id);
                    }}
                  >
                    <div className={styles.videoIcon}>
                      {completed ? "✅" : !accessible ? "🔒" : "▶️"}
                    </div>
                    <div className={styles.videoInfo}>
                      <div className={styles.videoTitle}>{video.title}</div>
                      <div className={styles.videoDuration}>
                        {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, "0")}
                      </div>
                    </div>
                  </li>
                );
              })}
            </li>
          ))}
        </ul>

        <div className={styles.quizSection}>
          <Link
            href={allCompleted && quizId ? `/my-courses/${slug}/quiz?quizId=${quizId}` : "#"}
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
