"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type AdminCourse = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: string;
  category: string;
  level: string;
  price: string | null;
  status: string;
  totalVideos: number;
  totalDuration: number;
  totalModules: number;
  hasQuiz: boolean;
  createdAt: string;
  createdBy: { id: string; name: string } | null;
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    title: "", description: "", category: "Business", type: "MULTI", level: "BEGINNER", price: "", status: "DRAFT"
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchCourses = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    fetch(`/api/admin/courses?${params}`)
      .then(r => r.json())
      .then(data => setCourses(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter, search]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchCourses();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setCreateError(data.error || "Failed to create course");
        return;
      }
      setShowCreate(false);
      setForm({ title: "", description: "", category: "Business", type: "MULTI", level: "BEGINNER", price: "", status: "DRAFT" });
      setLoading(true);
      fetchCourses();
    } catch {
      setCreateError("Network error");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      const res = await fetch(`/api/courses/${slug}`, { method: "DELETE" });
      if (res.ok) {
        setLoading(true);
        fetchCourses();
      }
    } catch {
      console.error("Failed to delete");
    }
  };

  const handleToggleStatus = async (slug: string, currentStatus: string) => {
    const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      await fetch(`/api/courses/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setLoading(true);
      fetchCourses();
    } catch {
      console.error("Failed to update status");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/courses/${id}/duplicate`, { method: "POST" });
      if (!res.ok) return;
      setLoading(true);
      fetchCourses();
    } catch {
      console.error("Failed to duplicate");
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Course Management</h1>
        <p className="admin-page-subtitle">Create, edit, and manage all courses</p>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Courses</div>
          <div className="admin-stat-value">{courses.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Published</div>
          <div className="admin-stat-value admin-kpi-success">
            {courses.filter(c => c.status === "PUBLISHED").length}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Videos</div>
          <div className="admin-stat-value">
            {courses.reduce((s, c) => s + c.totalVideos, 0)}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-section">
        <div className="admin-section-header">
          <div className="admin-toolbar">
            <form onSubmit={handleSearch} className="admin-form-inline">
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            {["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"].map((s) => (
              <button
                key={s}
                className={`admin-filter-btn ${(s === "ALL" && !statusFilter) || statusFilter === s ? "active" : ""}`}
                onClick={() => { setStatusFilter(s === "ALL" ? null : s); setLoading(true); }}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="admin-toolbar-actions">
            <button className="btn-primary admin-btn-compact"
              onClick={() => setShowCreate(!showCreate)}>
              {showCreate ? "Cancel" : "+ Quick Create"}
            </button>
            <Link href="/admin/courses/new" className="btn-secondary admin-btn-compact">
              📝 Full Form
            </Link>
          </div>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="admin-quick-card">
            <h4 className="admin-quick-title">Create New Course</h4>
            {createError && (
              <div className="admin-quick-error">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreate} className="admin-grid-two">
              <div className="admin-grid-full">
                <label className="admin-field-label">Title</label>
                <input className="admin-search-input admin-input-full"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="admin-grid-full">
                <label className="admin-field-label">Description</label>
                <textarea className="admin-search-input admin-input-full admin-textarea"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="admin-field-label">Category</label>
                <select className="admin-search-input admin-input-full"
                  value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {["Business", "Programming", "Design", "Audio/Video", "Marketing", "Personal Growth"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="admin-field-label">Level</label>
                <select className="admin-search-input admin-input-full"
                  value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                  {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="admin-field-label">Type</label>
                <select className="admin-search-input admin-input-full"
                  value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="SINGLE">Single Video</option>
                  <option value="MULTI">Multi Video</option>
                </select>
              </div>
              <div>
                <label className="admin-field-label">Price (Rp)</label>
                <input className="admin-search-input admin-input-full" type="number"
                  placeholder="0 = Free" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="admin-grid-full admin-row">
                <button type="submit" className="btn-primary admin-btn-compact" disabled={creating}>
                  {creating ? "Creating..." : "Create Course"}
                </button>
                <button type="button" className="btn-secondary admin-btn-compact"
                  onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Courses Table */}
        {loading ? (
          <div className="admin-empty">
            <div className="admin-loading-spinner admin-loading-compact" />
            Loading courses...
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Videos</th>
                  <th>Duration</th>
                  <th>Quiz</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="admin-table-empty">
                      No courses found
                    </td>
                  </tr>
                ) : courses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <div className="admin-course-title">{course.title}</div>
                      <div className="admin-course-slug">/{course.slug}</div>
                    </td>
                    <td>{course.category}</td>
                    <td>
                      {course.type === "SINGLE" ? "🎥 Single" : "📚 Multi"}
                    </td>
                    <td>{course.totalModules}M / {course.totalVideos}V</td>
                    <td>{formatDuration(course.totalDuration)}</td>
                    <td>{course.hasQuiz ? "✅" : "—"}</td>
                    <td>
                      <span className={`admin-badge-status ${course.status.toLowerCase()}`}>
                        {course.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <Link
                          href={`/admin/courses/${course.id}/edit`}
                          className="admin-filter-btn"
                          title="Edit"
                        >
                          ✏️
                        </Link>
                        <Link
                          href={`/admin/courses/${course.id}/quiz`}
                          className="admin-filter-btn"
                          title="Manage Quiz"
                        >
                          📝
                        </Link>
                        <button
                          className="admin-filter-btn"
                          onClick={() => handleToggleStatus(course.slug, course.status)}
                          title={course.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        >
                          {course.status === "PUBLISHED" ? "📤" : "📥"}
                        </button>
                        <button
                          className="admin-filter-btn"
                          onClick={() => handleDuplicate(course.id)}
                          title="Duplicate course"
                        >
                          📄
                        </button>
                        <button
                          className="admin-filter-btn admin-danger-outline"
                          onClick={() => handleDelete(course.slug)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
