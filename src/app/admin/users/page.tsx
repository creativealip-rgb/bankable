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
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = (query?: string, selectedRole?: string, targetPage?: number) => {
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (selectedRole) params.set("role", selectedRole);
    params.set("page", String(targetPage || page));
    params.set("pageSize", "20");
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(Array.isArray(data.items) ? data.items : []);
        setTotalPages(Math.max(1, Number(data.pagination?.totalPages || 1)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers(search, role, page);
  }, [page, role, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPage(1);
    fetchUsers(search, role, 1);
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
          <div className="admin-stat-value admin-kpi-secondary">{admins}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Avg. Videos Watched</div>
          <div className="admin-stat-value">{avgWatched}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Certificates</div>
          <div className="admin-stat-value admin-kpi-warning">{totalCerts}</div>
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
          <p className="admin-muted">No membership data</p>
        )}
      </div>

      {/* User List */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h3 className="admin-section-title">All Users</h3>
          <div className="admin-toolbar">
            <form onSubmit={handleSearch} className="admin-form-inline">
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="admin-search-input"
                value={role}
                onChange={(e) => {
                  setLoading(true);
                  setPage(1);
                  setRole(e.target.value);
                }}
              >
                <option value="">All Role</option>
                <option value="MEMBER">MEMBER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
              <button type="submit" className="admin-filter-btn active">Search</button>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="admin-empty">
            <div className="admin-loading-spinner admin-loading-inline" />
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
                    <td colSpan={7} className="admin-table-empty">
                      No users found
                    </td>
                  </tr>
                ) : users.map((user) => (
                  <tr key={user.id}>
                    <td data-label="User">
                      <div className="admin-inline-row">
                        <div className="admin-user-avatar admin-user-avatar-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="admin-name-strong">{user.name}</span>
                      </div>
                    </td>
                    <td data-label="Email" className="admin-email-cell">{user.email}</td>
                    <td data-label="Role">
                      <span className={`admin-badge-status ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td data-label="Membership">
                      <span className={`admin-badge-status ${user.membership === "PREMIUM" || user.membership === "LIFETIME" ? "published" : user.membership === "BASIC" ? "draft" : "archived"}`}>
                        {user.membership}
                      </span>
                    </td>
                    <td data-label="Videos Watched">
                      <div className="admin-inline-row">
                        <div className="admin-progress-track">
                          <div
                            className="admin-progress-fill"
                            style={{ width: `${Math.min((user.videosWatched / Math.max(user.totalProgress, 1)) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="admin-muted">
                          {user.videosWatched}{user.totalProgress > 0 ? `/${user.totalProgress}` : ""}
                        </span>
                      </div>
                    </td>
                    <td data-label="Certificates">
                      {user.certificateCount > 0 ? (
                        <span className="admin-crown">
                          🏆 {user.certificateCount}
                        </span>
                      ) : (
                        <span className="admin-table-placeholder">—</span>
                      )}
                    </td>
                    <td data-label="Joined" className="admin-email-cell">
                      {new Date(user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="admin-pagination">
          <button
            className="admin-filter-btn"
            onClick={() => {
              setLoading(true);
              setPage((p) => Math.max(1, p - 1));
            }}
            disabled={page <= 1}
          >
            ← Prev
          </button>
          <span className="admin-pagination-label">
            Page {page} / {totalPages}
          </span>
          <button
            className="admin-filter-btn"
            onClick={() => {
              setLoading(true);
              setPage((p) => Math.min(totalPages, p + 1));
            }}
            disabled={page >= totalPages}
          >
            Next →
          </button>
        </div>
      </div>
    </>
  );
}
