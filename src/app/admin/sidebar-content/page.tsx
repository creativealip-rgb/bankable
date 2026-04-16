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

  const webinars = useMemo(
    () => items.filter((item) => item.section === "WEBINAR"),
    [items]
  );
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

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Sidebar Content</h1>
        <p className="admin-page-subtitle">
          Manage upcoming webinar and premium paid video cards on the courses page
        </p>
      </div>

      <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
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
            {editingId ? "Edit Sidebar Item" : "Add Sidebar Item"}
          </h3>
        </div>

        {error && (
          <div style={{ marginBottom: "1rem", color: "var(--danger)", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: "0.75rem" }}>
            <select
              className="admin-search-input"
              value={form.section}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, section: e.target.value as SidebarSection }))
              }
            >
              <option value="WEBINAR">Upcoming Webinar</option>
              <option value="PREMIUM_VIDEO">Premium Paid Video</option>
            </select>
            <input
              className="admin-search-input"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            <input
              className="admin-search-input"
              type="number"
              placeholder="Order"
              value={form.sortOrder}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))
              }
            />
          </div>

          <input
            className="admin-search-input"
            placeholder={form.section === "WEBINAR" ? "Speaker / subtitle" : "Description / note"}
            value={form.subtitle}
            onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <input
              className="admin-search-input"
              placeholder={form.section === "WEBINAR" ? "Date label (contoh: 28 Apr)" : "Price label (contoh: Rp149.000)"}
              value={form.section === "WEBINAR" ? form.dateLabel : form.priceLabel}
              onChange={(e) =>
                setForm((prev) =>
                  prev.section === "WEBINAR"
                    ? { ...prev, dateLabel: e.target.value }
                    : { ...prev, priceLabel: e.target.value }
                )
              }
            />
            <input
              className="admin-search-input"
              placeholder={form.section === "WEBINAR" ? "CTA label (Save Seat)" : "CTA label (Optional)"}
              value={form.ctaLabel}
              onChange={(e) => setForm((prev) => ({ ...prev, ctaLabel: e.target.value }))}
            />
          </div>

          <input
            className="admin-search-input"
            placeholder="CTA link (optional, contoh: /register)"
            value={form.href}
            onChange={(e) => setForm((prev) => ({ ...prev, href: e.target.value }))}
          />

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            Active (show on sidebar)
          </label>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" className="btn-primary" style={{ padding: "10px 20px", fontSize: "0.9rem" }} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Item" : "Add Item"}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" style={{ padding: "10px 20px", fontSize: "0.9rem" }} onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h3 className="admin-section-title">Existing Sidebar Items</h3>
        </div>

        {loading ? (
          <div className="admin-empty">
            <div className="admin-loading-spinner" style={{ margin: "0 auto 1rem" }} />
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
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                      No sidebar items yet
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.section === "WEBINAR" ? "Webinar" : "Premium Video"}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.title}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          {item.subtitle || "—"}
                        </div>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
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
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button className="admin-filter-btn" onClick={() => startEdit(item)}>
                            ✏️
                          </button>
                          <button className="admin-filter-btn" onClick={() => toggleActive(item)}>
                            {item.isActive ? "⏸️" : "▶️"}
                          </button>
                          <button
                            className="admin-filter-btn"
                            style={{ borderColor: "rgba(248,113,113,0.3)", color: "var(--danger)" }}
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

