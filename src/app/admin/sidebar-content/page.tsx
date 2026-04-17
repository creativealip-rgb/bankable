"use client";

import { useEffect, useMemo, useState } from "react";

type SidebarSection = "WEBINAR" | "PREMIUM_VIDEO";

type SidebarItem = {
  id: string;
  section: SidebarSection;
  title: string;
  subtitle: string | null;
  dateLabel: string | null;
  ctaLabel: string | null;
  href: string | null;
  priceLabel: string | null;
  sortOrder: number;
  isActive: boolean;
};

type ItemForm = {
  section: SidebarSection;
  title: string;
  subtitle: string;
  dateLabel: string;
  ctaLabel: string;
  href: string;
  priceLabel: string;
  sortOrder: number;
  isActive: boolean;
};

const initialForm: ItemForm = {
  section: "WEBINAR",
  title: "",
  subtitle: "",
  dateLabel: "",
  ctaLabel: "",
  href: "",
  priceLabel: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminSidebarContentPage() {
  const [items, setItems] = useState<SidebarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ItemForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/admin/sidebar-items");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load sidebar content");
        return;
      }
      setItems(data);
    } catch {
      setError("Failed to load sidebar content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const webinars = useMemo(() => items.filter((item) => item.section === "WEBINAR"), [items]);
  const premiumVideos = useMemo(
    () => items.filter((item) => item.section === "PREMIUM_VIDEO"),
    [items]
  );

  const startEdit = (item: SidebarItem) => {
    setEditingId(item.id);
    setForm({
      section: item.section,
      title: item.title,
      subtitle: item.subtitle || "",
      dateLabel: item.dateLabel || "",
      ctaLabel: item.ctaLabel || "",
      href: item.href || "",
      priceLabel: item.priceLabel || "",
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setError("");
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const endpoint = editingId
        ? `/api/admin/sidebar-items/${editingId}`
        : "/api/admin/sidebar-items";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save item");
        return;
      }

      resetForm();
      setLoading(true);
      await fetchItems();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: SidebarItem) => {
    try {
      await fetch(`/api/admin/sidebar-items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      setLoading(true);
      await fetchItems();
    } catch {
      setError("Failed to update item status");
    }
  };

  const removeItem = async (item: SidebarItem) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    try {
      await fetch(`/api/admin/sidebar-items/${item.id}`, { method: "DELETE" });
      setLoading(true);
      await fetchItems();
    } catch {
      setError("Failed to delete item");
    }
  };

  const sectionLabel = form.section === "WEBINAR" ? "Upcoming Webinar" : "Premium Paid Video";
  const subtitleLabel = form.section === "WEBINAR" ? "Speaker / subtitle" : "Description / note";
  const metaLabel = form.section === "WEBINAR" ? "Date label" : "Price label";
  const metaPlaceholder = form.section === "WEBINAR" ? "Contoh: 28 Apr" : "Contoh: Rp149.000";
  const ctaPlaceholder = form.section === "WEBINAR" ? "Contoh: Save Seat" : "Contoh: Lihat Detail";
  const hrefHint =
    form.section === "WEBINAR"
      ? "Kosongkan link untuk auto-generate halaman detail webinar."
      : "Kosongkan link untuk auto-generate halaman detail premium video.";

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Sidebar Content</h1>
        <p className="admin-page-subtitle">
          Kelola kartu sidebar Webinar dan Premium Video pada halaman Courses
        </p>
      </div>

      <div className="admin-stats-grid admin-stats-grid-3">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Items</div>
          <div className="admin-stat-value">{items.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Webinar</div>
          <div className="admin-stat-value">{webinars.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Premium Video</div>
          <div className="admin-stat-value">{premiumVideos.length}</div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h3 className="admin-section-title">
            {editingId ? "Edit Item Sidebar" : "Tambah Item Sidebar"}
          </h3>
        </div>

        {error ? <div className="admin-feedback error">{error}</div> : null}

        <form onSubmit={handleSubmit} className="admin-grid-two">
          <label className="admin-form-field">
            <span className="admin-field-label">Section</span>
            <select
              className="admin-search-input admin-input-full"
              value={form.section}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, section: e.target.value as SidebarSection }))
              }
            >
              <option value="WEBINAR">Upcoming Webinar</option>
              <option value="PREMIUM_VIDEO">Premium Paid Video</option>
            </select>
          </label>

          <div className="admin-note admin-sidebar-guide">
            <strong className="admin-sidebar-guide-title">Format aktif: {sectionLabel}</strong>
            <span>Isi field mengikuti kebutuhan section ini agar card di Courses konsisten.</span>
          </div>

          <label className="admin-form-field admin-grid-full">
            <span className="admin-field-label">Title</span>
            <input
              className="admin-search-input admin-input-full"
              placeholder="Judul konten"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </label>

          <label className="admin-form-field admin-grid-full">
            <span className="admin-field-label">{subtitleLabel}</span>
            <input
              className="admin-search-input admin-input-full"
              placeholder={subtitleLabel}
              value={form.subtitle}
              onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
            />
          </label>

          <label className="admin-form-field">
            <span className="admin-field-label">{metaLabel}</span>
            <input
              className="admin-search-input admin-input-full"
              placeholder={metaPlaceholder}
              value={form.section === "WEBINAR" ? form.dateLabel : form.priceLabel}
              onChange={(e) =>
                setForm((prev) =>
                  prev.section === "WEBINAR"
                    ? { ...prev, dateLabel: e.target.value }
                    : { ...prev, priceLabel: e.target.value }
                )
              }
            />
          </label>

          <label className="admin-form-field">
            <span className="admin-field-label">CTA Label</span>
            <input
              className="admin-search-input admin-input-full"
              placeholder={ctaPlaceholder}
              value={form.ctaLabel}
              onChange={(e) => setForm((prev) => ({ ...prev, ctaLabel: e.target.value }))}
            />
          </label>

          <label className="admin-form-field admin-grid-full">
            <span className="admin-field-label">CTA Link (optional)</span>
            <input
              className="admin-search-input admin-input-full"
              placeholder="Contoh: /courses/nama-course atau /register"
              value={form.href}
              onChange={(e) => setForm((prev) => ({ ...prev, href: e.target.value }))}
            />
            <span className="admin-note">{hrefHint}</span>
          </label>

          <label className="admin-form-field">
            <span className="admin-field-label">Sort Order</span>
            <input
              className="admin-search-input admin-input-full"
              type="number"
              placeholder="0"
              value={form.sortOrder}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))
              }
            />
          </label>

          <label className="admin-sidebar-toggle">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            <span>Active (tampilkan di sidebar)</span>
          </label>

          <div className="admin-grid-full admin-row">
            <button type="submit" className="btn-primary admin-btn-compact" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Item" : "Add Item"}
            </button>
            {editingId ? (
              <button type="button" className="btn-secondary admin-btn-compact" onClick={resetForm}>
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h3 className="admin-section-title">Existing Sidebar Items</h3>
        </div>

        {loading ? (
          <div className="admin-empty">
            <div className="admin-loading-spinner admin-loading-compact" />
            Loading items...
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Title</th>
                  <th>Meta</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-table-empty">
                      No sidebar items yet
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.section === "WEBINAR" ? "Webinar" : "Premium Video"}</td>
                      <td>
                        <div className="admin-course-title">{item.title}</div>
                        <div className="admin-course-slug">{item.subtitle || "—"}</div>
                      </td>
                      <td className="admin-note">
                        {item.section === "WEBINAR"
                          ? `${item.dateLabel || "No date"}${item.ctaLabel ? ` • ${item.ctaLabel}` : ""}`
                          : `${item.priceLabel || "No price"}${item.ctaLabel ? ` • ${item.ctaLabel}` : ""}`}
                      </td>
                      <td>{item.sortOrder}</td>
                      <td>
                        <span className={`admin-badge-status ${item.isActive ? "published" : "archived"}`}>
                          {item.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button className="admin-filter-btn" onClick={() => startEdit(item)}>
                            ✏️
                          </button>
                          <button className="admin-filter-btn" onClick={() => toggleActive(item)}>
                            {item.isActive ? "⏸️" : "▶️"}
                          </button>
                          <button
                            className="admin-filter-btn admin-danger-outline"
                            onClick={() => removeItem(item)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
