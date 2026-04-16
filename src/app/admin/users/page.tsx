"use client";

import { useState, useEffect } from "react";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  createdAt: string;
  membership: string;
  certificateCount: number;
  videosWatched: number;
  totalProgress: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = (query?: string) => {
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((data) => setUsers(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchUsers(search);
  };

  // Compute analytics
  const totalUsers = users.length;
  const admins = users.filter((u) => u.role === "ADMIN").length;
  const totalCerts = users.reduce((s, u) => s + u.certificateCount, 0);
  const totalWatched = users.reduce((s, u) => s + u.videosWatched, 0);
  const avgWatched = totalUsers > 0 ? (totalWatched / totalUsers).toFixed(1) : "0";

  // Membership breakdown
  const membershipCounts = users.reduce((acc, u) => {
    acc[u.membership] = (acc[u.membership] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const membershipTiers = Object.entries(membershipCounts).sort((a, b) => b[1] - a[1]);
  const maxMembership = Math.max(...membershipTiers.map(([, c]) => c), 1);

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">User Analytics</h1>
        <p className="admin-page-subtitle">Overview and management of all platform users</p>
      </div>

      {/* Summary Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Users</div>
          <div className="admin-stat-value">{totalUsers}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Admins</div>
          <div className="admin-stat-value" style={{ color: "var(--secondary)" }}>{admins}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Avg. Videos Watched</div>
          <div className="admin-stat-value">{avgWatched}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Certificates</div>
          <div className="admin-stat-value" style={{ color: "var(--warning)" }}>{totalCerts}</div>
        </div>
      </div>

      {/* Membership Breakdown */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h3 className="admin-section-title">Membership Distribution</h3>
        </div>
        {membershipTiers.length > 0 ? membershipTiers.map(([tier, count]) => (
          <div key={tier} className="admin-chart-bar">
            <span className="admin-chart-bar-label">{tier}</span>
            <div className="admin-chart-bar-track">
              <div
                className="admin-chart-bar-fill"
                style={{ width: `${(count / maxMembership) * 100}%` }}
              />
            </div>
            <span className="admin-chart-bar-value">{count}</span>
          </div>
        )) : (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No membership data</p>
        )}
      </div>

      {/* User List */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h3 className="admin-section-title">All Users</h3>
          <div className="admin-toolbar">
            <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="admin-filter-btn active">Search</button>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="admin-empty">
            <div className="admin-loading-spinner" style={{ margin: "0 auto 1rem" }} />
            Loading users...
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Membership</th>
                  <th>Videos Watched</th>
                  <th>Certificates</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                      No users found
                    </td>
                  </tr>
                ) : users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div className="admin-user-avatar" style={{ width: 32, height: 32, fontSize: "0.75rem" }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{user.name}</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{user.email}</td>
                    <td>
                      <span className={`admin-badge-status ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge-status ${user.membership === "PREMIUM" || user.membership === "LIFETIME" ? "published" : user.membership === "BASIC" ? "draft" : "archived"}`}>
                        {user.membership}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{
                          width: "50px",
                          height: "6px",
                          background: "rgba(255,255,255,0.9)",
                          borderRadius: "3px",
                          overflow: "hidden"
                        }}>
                          <div style={{
                            width: `${Math.min((user.videosWatched / Math.max(user.totalProgress, 1)) * 100, 100)}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, var(--primary), var(--secondary))",
                            borderRadius: "3px",
                          }} />
                        </div>
                        <span style={{ fontSize: "0.85rem" }}>
                          {user.videosWatched}{user.totalProgress > 0 ? `/${user.totalProgress}` : ""}
                        </span>
                      </div>
                    </td>
                    <td>
                      {user.certificateCount > 0 ? (
                        <span style={{ color: "var(--warning)", fontWeight: 600 }}>
                          🏆 {user.certificateCount}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ color: "var(--text-muted)", whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                      {new Date(user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
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
