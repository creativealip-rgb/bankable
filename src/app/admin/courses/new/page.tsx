"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Link from "next/link";

type VideoInput = {
  title: string;
  url: string;
  duration: number;
};

type ModuleInput = {
  title: string;
  videos: VideoInput[];
};

const categories = ["Business", "Programming", "Design", "Audio/Video", "Marketing", "Personal Growth"];
const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

export default function NewCoursePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Course details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"SINGLE" | "MULTI">("MULTI");
  const [category, setCategory] = useState("Business");
  const [level, setLevel] = useState("BEGINNER");
  const [price, setPrice] = useState("");
  const [minWatchPct, setMinWatchPct] = useState("90");

  // Modules & Videos
  const [modules, setModules] = useState<ModuleInput[]>([
    { title: "Module 1", videos: [{ title: "Video 1", url: "", duration: 600 }] },
  ]);

  const addModule = () => {
    setModules([
      ...modules,
      {
        title: `Module ${modules.length + 1}`,
        videos: [{ title: "Video 1", url: "", duration: 600 }],
      },
    ]);
  };

  const removeModule = (mIndex: number) => {
    if (modules.length <= 1) return;
    setModules(modules.filter((_, i) => i !== mIndex));
  };

  const updateModuleTitle = (mIndex: number, title: string) => {
    const updated = [...modules];
    updated[mIndex].title = title;
    setModules(updated);
  };

  const addVideo = (mIndex: number) => {
    const updated = [...modules];
    updated[mIndex].videos.push({
      title: `Video ${updated[mIndex].videos.length + 1}`,
      url: "",
      duration: 600,
    });
    setModules(updated);
  };

  const removeVideo = (mIndex: number, vIndex: number) => {
    const updated = [...modules];
    if (updated[mIndex].videos.length <= 1) return;
    updated[mIndex].videos = updated[mIndex].videos.filter((_, i) => i !== vIndex);
    setModules(updated);
  };

  const updateVideo = (mIndex: number, vIndex: number, field: keyof VideoInput, value: string | number) => {
    const updated = [...modules];
    (updated[mIndex].videos[vIndex] as Record<string, unknown>)[field] = value;
    setModules(updated);
  };

  const handleSubmit = async (status: "DRAFT" | "PUBLISHED") => {
    if (!title.trim() || !category) {
      alert("Title and category are required.");
      return;
    }

    setSaving(true);

    try {
      // 1. Create the course
      const courseRes = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          category,
          level,
          price: price || "0",
          status,
          minWatchPct: parseInt(minWatchPct),
        }),
      });

      if (!courseRes.ok) {
        const err = await courseRes.json();
        alert(`Failed to create course: ${err.error}`);
        return;
      }

      const course = await courseRes.json();

      // 2. Create modules and videos
      for (let mIdx = 0; mIdx < modules.length; mIdx++) {
        const mod = modules[mIdx];

        const modRes = await fetch(`/api/courses/${course.slug}/modules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: mod.title,
            order: mIdx,
          }),
        });

        if (!modRes.ok) continue;
        const createdMod = await modRes.json();

        // 3. Create videos for this module
        for (let vIdx = 0; vIdx < mod.videos.length; vIdx++) {
          const video = mod.videos[vIdx];
          await fetch(`/api/courses/${course.slug}/videos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              moduleId: createdMod.id,
              title: video.title,
              url: video.url || null,
              duration: video.duration,
              order: vIdx,
            }),
          });
        }
      }

      router.push("/admin/courses");
    } catch (error) {
      console.error("Failed to create course:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <Link href="/admin/courses" className={styles.backLink}>
        ← Back to Courses
      </Link>

      <div className={styles.header}>
        <h1 className={styles.title}>Create New Course</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Fill in the details below to create a new course for your members.
        </p>
      </div>

      {/* Basic Info */}
      <div className={styles.formCard}>
        <h2 className={styles.sectionTitle}>Course Details</h2>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Course Title *</label>
          <input
            type="text"
            className={styles.formInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Financial Planning Masterclass"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Description</label>
          <textarea
            className={styles.formTextarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what students will learn in this course..."
          />
        </div>

        <div className={styles.formRow3}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Category *</label>
            <select className={styles.formSelect} value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Level</label>
            <select className={styles.formSelect} value={level} onChange={(e) => setLevel(e.target.value)}>
              {levels.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Price (Rp)</label>
            <input
              type="number"
              className={styles.formInput}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0 = Free"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Min Watch Percentage (%)</label>
          <input
            type="number"
            className={styles.formInput}
            value={minWatchPct}
            onChange={(e) => setMinWatchPct(e.target.value)}
            min="1"
            max="100"
            style={{ maxWidth: "120px" }}
          />
        </div>
      </div>

      {/* Course Type */}
      <div className={styles.formCard}>
        <h2 className={styles.sectionTitle}>Course Type</h2>
        <div className={styles.typeSelector}>
          <div
            className={`${styles.typeOption} ${type === "SINGLE" ? styles.typeOptionActive : ""}`}
            onClick={() => {
              setType("SINGLE");
              setModules([{ title: "Main", videos: [{ title: "Full Video", url: "", duration: 3600 }] }]);
            }}
          >
            <div className={styles.typeOptionIcon}>🎬</div>
            <div className={styles.typeOptionName}>Single Video</div>
            <div className={styles.typeOptionDesc}>One full-length video course</div>
          </div>
          <div
            className={`${styles.typeOption} ${type === "MULTI" ? styles.typeOptionActive : ""}`}
            onClick={() => setType("MULTI")}
          >
            <div className={styles.typeOptionIcon}>📂</div>
            <div className={styles.typeOptionName}>Multi Video</div>
            <div className={styles.typeOptionDesc}>Multiple modules with sequential videos</div>
          </div>
        </div>
      </div>

      {/* Modules & Videos */}
      <div className={styles.formCard}>
        <h2 className={styles.sectionTitle}>
          {type === "SINGLE" ? "Video" : "Modules & Videos"}
        </h2>

        {modules.map((mod, mIndex) => (
          <div key={mIndex} className={styles.moduleItem}>
            <div className={styles.moduleHeader}>
              <div className={styles.moduleNumber}>{mIndex + 1}</div>
              <input
                type="text"
                className={styles.moduleInput}
                value={mod.title}
                onChange={(e) => updateModuleTitle(mIndex, e.target.value)}
                placeholder="Module title"
              />
              {type === "MULTI" && modules.length > 1 && (
                <button type="button" className={styles.removeBtn} onClick={() => removeModule(mIndex)}>
                  ✕
                </button>
              )}
            </div>

            {mod.videos.map((video, vIndex) => (
              <div key={vIndex} className={styles.videoItem}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", width: "20px" }}>
                  {vIndex + 1}.
                </span>
                <input
                  type="text"
                  className={styles.videoInput}
                  value={video.title}
                  onChange={(e) => updateVideo(mIndex, vIndex, "title", e.target.value)}
                  placeholder="Video title"
                />
                <input
                  type="text"
                  className={`${styles.videoInput} ${styles.urlInput}`}
                  value={video.url}
                  onChange={(e) => updateVideo(mIndex, vIndex, "url", e.target.value)}
                  placeholder="Video URL"
                />
                <input
                  type="number"
                  className={`${styles.videoInput} ${styles.durationInput}`}
                  value={video.duration}
                  onChange={(e) => updateVideo(mIndex, vIndex, "duration", parseInt(e.target.value) || 0)}
                  placeholder="Secs"
                  title="Duration in seconds"
                />
                {mod.videos.length > 1 && (
                  <button type="button" className={styles.removeBtn} onClick={() => removeVideo(mIndex, vIndex)}>
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button type="button" className={styles.addBtn} onClick={() => addVideo(mIndex)}>
              + Add Video
            </button>
          </div>
        ))}

        {type === "MULTI" && (
          <button type="button" className={styles.addBtn} onClick={addModule} style={{ width: "100%", padding: "12px" }}>
            + Add Module
          </button>
        )}
      </div>

      {/* Submit */}
      <div className={styles.submitArea}>
        <button
          type="button"
          className={styles.draftBtn}
          onClick={() => handleSubmit("DRAFT")}
          disabled={saving}
        >
          Save as Draft
        </button>
        <button
          type="button"
          className={styles.submitBtn}
          onClick={() => handleSubmit("PUBLISHED")}
          disabled={saving}
        >
          {saving ? "Creating..." : "Publish Course"}
        </button>
      </div>
    </div>
  );
}
