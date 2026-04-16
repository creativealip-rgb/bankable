"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Video = { id: string; title: string; url: string | null; duration: number; order: number };
type Module = { id: string; title: string; order: number; videos: Video[] };
type CourseData = {
  id: string; title: string; slug: string; description: string | null;
  type: string; category: string; level: string; price: string | null;
  status: string; minWatchPct: number;
  modules: Module[]; totalVideos: number; totalModules: number;
  quiz: { id: string; title: string }[];
};

const categories = ["Business", "Programming", "Design", "Audio/Video", "Marketing", "Personal Growth"];
const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

type PageProps = { params: Promise<{ id: string }> };

export default function EditCoursePage({ params }: PageProps) {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Business");
  const [level, setLevel] = useState("BEGINNER");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [minWatchPct, setMinWatchPct] = useState("90");

  useEffect(() => { params.then((p) => setCourseId(p.id)); }, [params]);

  useEffect(() => {
    if (!courseId) return;
    async function fetchCourse() {
      try {
        // We need the slug from id — use admin courses API
        const res = await fetch(`/api/admin/courses`);
        if (!res.ok) return;
        const all = await res.json();
        const found = all.find((c: CourseData) => c.id === courseId);
        if (!found) return;

        // Fetch full detail by slug
        const detailRes = await fetch(`/api/courses/${found.slug}`);
        if (!detailRes.ok) return;
        const data = await detailRes.json();
        setCourse(data);
        setTitle(data.title); setDescription(data.description || "");
        setCategory(data.category); setLevel(data.level);
        setPrice(data.price || ""); setStatus(data.status);
        setMinWatchPct(String(data.minWatchPct));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchCourse();
  }, [courseId]);

  const handleSave = async () => {
    if (!course) return;
    setSaving(true); setSaved(false);
    try {
      const res = await fetch(`/api/courses/${course.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, level, price: price || "0", status, minWatchPct: parseInt(minWatchPct) }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch { alert("Failed to save"); } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <>
        <div className="admin-page-header">
          <h1 className="admin-page-title">Loading...</h1>
        </div>
      </>
    );
  }
  if (!course) {
    return (
      <>
        <div className="admin-page-header">
          <h1 className="admin-page-title">Course Not Found</h1>
          <Link href="/admin/courses" style={{ color: "var(--primary)" }}>← Back to courses</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <Link href="/admin/courses" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>← Back to courses</Link>
          <h1 className="admin-page-title" style={{ marginTop: "0.5rem" }}>Edit: {course.title}</h1>
          <p className="admin-page-subtitle">/{course.slug}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {saved && <span style={{ color: "var(--success)", fontSize: "0.9rem" }}>✓ Saved</span>}
          <button className="btn-primary" style={{ padding: "10px 24px", fontSize: "0.9rem" }} onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Modules</div>
          <div className="admin-stat-value">{course.totalModules}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Videos</div>
          <div className="admin-stat-value">{course.totalVideos}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Quiz</div>
          <div className="admin-stat-value">{course.quiz?.length > 0 ? "✅" : "—"}</div>
        </div>
        <div className="admin-stat-card" style={{ cursor: "pointer" }} onClick={() => router.push(`/admin/courses/${courseId}/quiz`)}>
          <div className="admin-stat-label" style={{ color: "var(--primary)" }}>Manage Quiz →</div>
          <div className="admin-stat-value" style={{ fontSize: "1rem" }}>📝</div>
        </div>
      </div>

      {/* Course Details */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Course Details</h2>
        </div>
        <div style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Title</label>
            <input className="admin-search-input" style={{ width: "100%", minWidth: 0 }} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Description</label>
            <textarea className="admin-search-input" style={{ width: "100%", minWidth: 0, minHeight: "100px", resize: "vertical" }}
              value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Category</label>
              <select className="admin-search-input" style={{ width: "100%", minWidth: 0 }} value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Level</label>
              <select className="admin-search-input" style={{ width: "100%", minWidth: 0 }} value={level} onChange={(e) => setLevel(e.target.value)}>
                {levels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Price (Rp)</label>
              <input className="admin-search-input" style={{ width: "100%", minWidth: 0 }} type="number" placeholder="0 = Free" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Status</label>
              <select className="admin-search-input" style={{ width: "100%", minWidth: 0 }} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Min Watch % (for progression)</label>
            <input className="admin-search-input" style={{ width: "120px", minWidth: 0 }} type="number" min="1" max="100"
              value={minWatchPct} onChange={(e) => setMinWatchPct(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Modules & Videos */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Modules & Videos</h2>
        </div>
        {course.modules.length === 0 ? (
          <div className="admin-empty">No modules yet. Add modules via the Create Course form.</div>
        ) : (
          course.modules.map((mod) => (
            <div key={mod.id} style={{
              border: "1px solid rgba(63,63,70,0.3)", borderRadius: "12px",
              marginBottom: "0.75rem", overflow: "hidden",
            }}>
              <div style={{
                padding: "1rem 1.25rem", background: "rgba(255,255,255,0.9)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                fontWeight: 600, fontSize: "0.95rem",
              }}>
                <span>📂 {mod.title}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {mod.videos.length} videos
                </span>
              </div>
              {mod.videos.map((v) => (
                <div key={v.id} style={{
                  padding: "0.75rem 1.25rem", borderTop: "1px solid rgba(63,63,70,0.15)",
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  fontSize: "0.9rem", color: "var(--text-muted)",
                }}>
                  <span>▶️</span>
                  <span style={{ flex: 1 }}>{v.title}</span>
                  <span style={{ fontSize: "0.78rem" }}>
                    {Math.floor(v.duration / 60)}:{String(v.duration % 60).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: "0.78rem", opacity: 0.5 }}>{v.url ? "🔗" : "—"}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );
}
