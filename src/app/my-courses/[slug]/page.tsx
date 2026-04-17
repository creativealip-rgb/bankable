"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import styles from "./page.module.css";
import Link from "next/link";

type Video = {
  id: string; title: string; url: string | null; subtitleUrl?: string | null; duration: number; order: number;
};
type Module = { id: string; title: string; order: number; videos: Video[] };
type Quiz = { id: string; title: string; passingGrade: number; timeLimit: number; maxAttempts: number };
type Course = {
  id: string; title: string; slug: string; description: string | null;
  type: string; minWatchPct: number; modules: Module[]; quiz: Quiz[];
  price?: string | null;
  hasPremiumAccess?: boolean;
  totalVideos: number; totalDuration: number;
};
type VideoProgress = { watchedPct: string; lastPosition: number; isCompleted: boolean };
type ProgressData = {
  totalVideos: number; completedVideos: number; overallProgress: number;
  videoProgress: Record<string, VideoProgress>;
};
type VideoSource =
  | { kind: "none" }
  | { kind: "file"; src: string }
  | { kind: "audio"; src: string }
  | { kind: "pdf"; src: string }
  | { kind: "youtube"; src: string }
  | { kind: "unsupported"; src: string };

type PageProps = { params: Promise<{ slug: string }> };

export default function CoursePlayerPage({ params }: PageProps) {
  const [slug, setSlug] = useState("");
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Video player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [watchedPct, setWatchedPct] = useState(0);
  const [maxWatchedTime, setMaxWatchedTime] = useState(0);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Notes state
  const [noteText, setNoteText] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);

  useEffect(() => { params.then((p) => setSlug(p.slug)); }, [params]);

  const resolveVideoSource = useCallback((rawUrl?: string | null): VideoSource => {
    const value = (rawUrl || "").trim();
    if (!value) return { kind: "none" };

    const normalized = value.split("?")[0].toLowerCase();

    if (value.startsWith("blob:")) return { kind: "file", src: value };
    if (normalized.endsWith(".pdf")) return { kind: "pdf", src: value };
    if (normalized.endsWith(".mp3") || normalized.endsWith(".wav") || normalized.endsWith(".m4a") || normalized.endsWith(".aac")) {
      return { kind: "audio", src: value };
    }
    if (normalized.endsWith(".mp4") || normalized.endsWith(".webm") || normalized.endsWith(".ogg")) {
      return { kind: "file", src: value };
    }

    let youtubeId: string | null = null;
    try {
      const parsed = new URL(value);
      const host = parsed.hostname.replace("www.", "");
      if (host === "youtu.be") {
        youtubeId = parsed.pathname.split("/").filter(Boolean)[0] || null;
      } else if (host.includes("youtube.com")) {
        if (parsed.pathname === "/watch") {
          youtubeId = parsed.searchParams.get("v");
        } else if (parsed.pathname.startsWith("/embed/")) {
          youtubeId = parsed.pathname.split("/")[2] || null;
        } else if (parsed.pathname.startsWith("/shorts/")) {
          youtubeId = parsed.pathname.split("/")[2] || null;
        }
      }
    } catch {
      youtubeId = null;
    }

    if (youtubeId) {
      return {
        kind: "youtube",
        src: `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`,
      };
    }

    return { kind: "unsupported", src: value };
  }, []);

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
          const isPaidCourse = Number(courseData.price || 0) > 0;
          const hasPremiumAccess = Boolean(courseData.hasPremiumAccess);
          if (isPaidCourse && !hasPremiumAccess) {
            setAccessDenied(true);
            return;
          }
          setCourse(courseData);
          const allVideos = courseData.modules.flatMap((m: Module) => m.videos);
          if (allVideos.length > 0) {
            if (progressRes.ok) {
              const progressData = await progressRes.json();
              setProgress(progressData);
              const firstIncomplete = allVideos.find(
                (v: Video) => !progressData.videoProgress[v.id]?.isCompleted
              );
              setActiveVideoId(firstIncomplete?.id || allVideos[0].id);
            } else if (progressRes.status === 403) {
              setAccessDenied(true);
            } else {
              setActiveVideoId(allVideos[0].id);
            }
          }
        }
      } catch (error) { console.error("Failed to load course:", error); }
      finally { setLoading(false); }
    }
    fetchData();
  }, [slug]);

  const allVideos = useMemo(() => course?.modules.flatMap((m) => m.videos) || [], [course]);

  const isVideoAccessible = useCallback((video: Video): boolean => {
    if (!progress || !course) return video === allVideos[0];
    const videoIndex = allVideos.findIndex((v) => v.id === video.id);
    if (videoIndex === 0) return true;
    const prevVideo = allVideos[videoIndex - 1];
    return progress.videoProgress[prevVideo.id]?.isCompleted || false;
  }, [progress, course, allVideos]);

  const activeVideo = allVideos.find((v) => v.id === activeVideoId);
  const activeModule = course?.modules.find((m) => m.videos.some((v) => v.id === activeVideoId));

  const saveProgress = useCallback(async (markComplete: boolean) => {
    if (!activeVideoId) return;
    const pct = markComplete ? 95 : Math.max(watchedPct, Math.floor((currentTime / Math.max(duration, 1)) * 100));

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: activeVideoId,
          watchedPct: String(pct),
          lastPosition: Math.floor(currentTime),
        }),
      });

      setMaxWatchedTime((prev) => Math.max(prev, currentTime));

      if (markComplete || pct >= (course?.minWatchPct || 90)) {
        const progressRes = await fetch(`/api/progress?courseSlug=${slug}`);
        if (progressRes.ok) {
          const newProgress = await progressRes.json();
          setProgress(newProgress);

          if (markComplete) {
            const currentIndex = allVideos.findIndex((v) => v.id === activeVideoId);
            if (currentIndex < allVideos.length - 1) {
              setActiveVideoId(allVideos[currentIndex + 1].id);
            }
          }
        }
      }
    } catch (error) { console.error("Failed to save progress:", error); }
  }, [activeVideoId, watchedPct, currentTime, duration, course?.minWatchPct, slug, allVideos]);

  // Auto-save progress every 10 seconds
  useEffect(() => {
    if (!activeVideoId || !isPlaying) return;

    autoSaveRef.current = setInterval(() => {
      saveProgress(false);
    }, 10000);

    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [activeVideoId, isPlaying, saveProgress]);

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const ct = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(ct);
    setMaxWatchedTime((prev) => Math.max(prev, ct));
    if (dur > 0) setWatchedPct(Math.floor((ct / dur) * 100));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const requested = parseFloat(e.target.value);
    const allowed = Math.min(requested, maxWatchedTime + 5);
    const time = Number.isFinite(allowed) ? allowed : 0;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleNativeSeeking = () => {
    if (!videoRef.current) return;
    if (videoRef.current.currentTime > maxWatchedTime + 5) {
      videoRef.current.currentTime = maxWatchedTime + 5;
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const changeSpeed = (speed: number) => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.volume = vol;
    setVolume(vol);
  };

  const toggleFullscreen = () => {
    const wrapper = document.querySelector(`.${styles.videoWrapper}`);
    if (wrapper) {
      if (document.fullscreenElement) document.exitFullscreen();
      else wrapper.requestFullscreen();
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const handleSimulateWatch = async () => {
    await saveProgress(true);
  };

  const addBookmark = () => {
    const rounded = Math.floor(currentTime);
    setBookmarks((prev) => Array.from(new Set([...prev, rounded])).sort((a, b) => a - b));
  };

  useEffect(() => {
    if (!activeVideoId) return;
    const notesKey = `bankable-notes-${slug}-${activeVideoId}`;
    const marksKey = `bankable-bookmarks-${slug}-${activeVideoId}`;
    setNoteText(localStorage.getItem(notesKey) || "");
    try {
      setBookmarks(JSON.parse(localStorage.getItem(marksKey) || "[]"));
    } catch {
      setBookmarks([]);
    }
    setMaxWatchedTime(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setWatchedPct(0);
  }, [activeVideoId, slug]);

  useEffect(() => {
    if (!activeVideoId) return;
    localStorage.setItem(`bankable-notes-${slug}-${activeVideoId}`, noteText);
  }, [noteText, activeVideoId, slug]);

  useEffect(() => {
    if (!activeVideoId) return;
    localStorage.setItem(`bankable-bookmarks-${slug}-${activeVideoId}`, JSON.stringify(bookmarks));
  }, [bookmarks, activeVideoId, slug]);

  const allCompleted = progress ? progress.completedVideos >= progress.totalVideos : false;
  const quizId = course?.quiz?.[0]?.id;

  const activeVideoSource = resolveVideoSource(activeVideo?.url);

  if (loading) {
    return (
      <div className={styles.courseContainer}>
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)", width: "100%" }}>
          Loading course...
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className={styles.courseContainer}>
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)", width: "100%" }}>
          Premium access belum aktif untuk course ini.{" "}
          <Link href={`/courses/${slug}`} style={{ color: "var(--primary)" }}>Kembali ke detail course</Link>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.courseContainer}>
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)", width: "100%" }}>
          Course not found. <Link href="/courses" style={{ color: "var(--primary)" }}>Back to courses</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.courseContainer}>
      <div className={styles.mainContent}>
        <div className={styles.courseHeader}>
          <Link href={`/courses/${slug}`} className={styles.backDetailLink}>
            ← Back to detail
          </Link>
          <h1 className={styles.courseTitle}>{course.title}</h1>
          <p style={{ color: "var(--text-muted)" }}>
            {activeModule?.title} — {activeVideo?.title}
          </p>
        </div>

        {/* Video Player */}
        <div className={styles.videoWrapper}>
          {activeVideoSource.kind === "file" ? (
            <>
              <video
                ref={videoRef}
                style={{ width: "100%", height: "100%" }}
                onTimeUpdate={handleVideoTimeUpdate}
                onLoadedMetadata={() => {
                  if (videoRef.current) setDuration(videoRef.current.duration);
                }}
                onEnded={() => { setIsPlaying(false); saveProgress(true); }}
                onSeeking={handleNativeSeeking}
                onClick={togglePlayPause}
              >
                <source src={activeVideo?.url || ""} />
                {activeVideo?.subtitleUrl && (
                  <track kind="subtitles" src={activeVideo.subtitleUrl} srcLang="id" label="Indonesia" default />
                )}
              </video>
              {/* Custom Controls */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "linear-gradient(transparent, rgba(15,23,42,0.82))",
                padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem",
              }}>
                {/* Seek Bar */}
                <input type="range" min={0} max={duration || 1} step={0.1} value={currentTime}
                  onChange={handleSeek}
                  style={{ width: "100%", accentColor: "var(--primary)", height: "4px", cursor: "pointer" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.85rem" }}>
                  <button onClick={togglePlayPause} style={{ background: "none", border: "none", color: "#fff", fontSize: "1.2rem", cursor: "pointer" }}>
                    {isPlaying ? "⏸" : "▶️"}
                  </button>
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  <input type="range" min={0} max={1} step={0.05} value={volume} onChange={handleVolumeChange}
                    style={{ width: "80px", accentColor: "var(--primary)", cursor: "pointer" }} />
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>
                    {Math.round(volume * 100)}%
                  </span>
                  <div style={{ position: "relative", marginLeft: "auto" }}>
                    <button onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}>
                      {playbackSpeed}x
                    </button>
                    {showSpeedMenu && (
                      <div style={{
                        position: "absolute", bottom: "100%", right: 0, background: "var(--surface)",
                        border: "1px solid var(--border)", borderRadius: "8px", padding: "0.25rem", minWidth: "80px",
                        marginBottom: "4px", zIndex: 10,
                      }}>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                          <button key={s} onClick={() => changeSpeed(s)}
                            style={{
                              display: "block", width: "100%", padding: "6px 12px", background: s === playbackSpeed ? "rgba(34,211,238,0.1)" : "none",
                              border: "none", color: s === playbackSpeed ? "var(--primary)" : "var(--text-main)", fontSize: "0.85rem", cursor: "pointer", textAlign: "left", borderRadius: "4px",
                            }}>
                            {s}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={toggleFullscreen}
                    style={{ background: "none", border: "none", color: "#fff", fontSize: "1.1rem", cursor: "pointer" }}>
                    ⛶
                  </button>
                </div>
              </div>
            </>
          ) : activeVideoSource.kind === "youtube" ? (
            <>
              <iframe
                src={activeVideoSource.src}
                title={activeVideo?.title || "YouTube video player"}
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </>
          ) : activeVideoSource.kind === "audio" ? (
            <div className={styles.videoPlaceholder}>
              <div style={{ textAlign: "center", width: "100%", maxWidth: "640px", padding: "1rem" }}>
                <p style={{ marginBottom: "0.75rem", fontSize: "1rem" }}>🎧 {activeVideo?.title || "Audio Lesson"}</p>
                <audio controls style={{ width: "100%" }} src={activeVideoSource.src}>
                  Browser tidak mendukung audio player.
                </audio>
              </div>
            </div>
          ) : activeVideoSource.kind === "pdf" ? (
            <iframe
              src={activeVideoSource.src}
              title={activeVideo?.title || "PDF Viewer"}
              style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
            />
          ) : (
            <div className={styles.videoPlaceholder}>
              {activeVideoSource.kind === "unsupported" ? (
                <div style={{ textAlign: "center" }}>
                  <p style={{ marginBottom: "1rem" }}>🎬 {activeVideo?.title || "Video"}</p>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                    Format video belum didukung: {activeVideoSource.src}
                  </p>
                </div>
              ) : (
                <p>No video URL configured</p>
              )}
            </div>
          )}
        </div>

        {activeVideoSource.kind !== "file" && (
          <div className={styles.playerActions}>
            <button
              className="btn-primary"
              onClick={handleSimulateWatch}
              disabled={!activeVideoId || !isVideoAccessible(activeVideo!)}
            >
              ✅ Mark as Watched (≥ 90%)
            </button>
          </div>
        )}

        {/* Notes Section */}
        <div style={{ marginBottom: "2rem" }}>
          <button
            onClick={() => setShowNotes(!showNotes)}
            style={{
              background: "none", border: "1px solid rgba(63,63,70,0.4)", color: "var(--text-muted)",
              padding: "8px 16px", borderRadius: "10px", fontSize: "0.85rem", cursor: "pointer",
              marginBottom: showNotes ? "0.75rem" : 0,
            }}
          >
            📝 {showNotes ? "Hide Notes" : "Show Notes"}
          </button>
          {showNotes && (
            <>
              <div style={{ marginBottom: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={addBookmark}
                  style={{ background: "none", border: "1px solid rgba(63,63,70,0.4)", color: "var(--text-muted)", padding: "6px 12px", borderRadius: "8px", cursor: "pointer" }}
                >
                  🔖 Add bookmark ({formatTime(currentTime)})
                </button>
                {bookmarks.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = b;
                        setCurrentTime(b);
                      }
                    }}
                    style={{ background: "none", border: "1px solid rgba(63,63,70,0.4)", color: "var(--text-muted)", padding: "6px 10px", borderRadius: "8px", cursor: "pointer" }}
                  >
                    {formatTime(b)}
                  </button>
                ))}
              </div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Take notes while watching..."
                style={{
                  width: "100%", minHeight: "100px", padding: "12px 16px",
                  background: "rgba(255,255,255,0.92)", border: "1px solid rgba(63,63,70,0.5)",
                  borderRadius: "12px", color: "var(--text-main)", fontFamily: "var(--font-sans)",
                  fontSize: "0.9rem", resize: "vertical",
                }}
              />
            </>
          )}
        </div>

        <div className="glass-panel" style={{ padding: "2rem" }}>
          <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "1rem" }}>Description</h2>
          <p style={{ color: "var(--text-muted)", lineHeight: "1.8" }}>
            {course.description || "No description available."}
          </p>
        </div>
      </div>

      {/* Sidebar */}
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
              <ul className={styles.moduleVideoList}>
                {mod.videos.map((video) => {
                  const vp = progress?.videoProgress[video.id];
                  const accessible = isVideoAccessible(video);
                  const completed = vp?.isCompleted;
                  return (
                    <li
                      key={video.id}
                      className={`${styles.videoItem} ${activeVideoId === video.id ? styles.active : ""} ${!accessible ? styles.locked : ""}`}
                      onClick={() => { if (accessible) setActiveVideoId(video.id); }}
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
              </ul>
            </li>
          ))}
        </ul>

        <div className={styles.quizSection}>
          <Link
            href={allCompleted && quizId ? `/my-courses/${slug}/quiz?quizId=${quizId}` : "#"}
            className={`${styles.quizButton} ${allCompleted ? styles.unlocked : styles.locked}`}
            onClick={(e) => { if (!allCompleted) e.preventDefault(); }}
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
