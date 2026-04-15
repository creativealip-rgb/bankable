"use client";

import { useState, useEffect } from "react";

type AdminStats = {
  overview: {
    totalUsers: number;
    totalCourses: number;
    totalVideos: number;
    totalCertificates: number;
    totalVideoProgress: number;
    totalQuizAttempts: number;
    newUsersLast7Days: number;
    activeSessions: number;
  };
  usersByRole: { role: string; count: number }[];
  coursesByStatus: { status: string; count: number }[];
  coursesByCategory: { category: string; count: number }[];
  membershipsByTier: { tier: string; count: number }[];
  recentUsers: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    image: string | null;
  }[];
  topCourses: {
    courseId: string;
    title: string;
    slug: string;
    category: string;
    status: string;
    progressCount: number;
  }[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="admin-empty">
        <div className="admin-loading-spinner" style={{ margin: "0 auto 1rem" }} />
        Loading analytics...
      </div>
    );
  }

  if (!stats) return <div className="admin-empty">Failed to load analytics</div>;

  const maxCategoryCount = Math.max(...(stats.coursesByCategory.map(c => c.count)), 1);
  const maxCourseProgress = Math.max(...(stats.topCourses.map(c => c.progressCount)), 1);

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">Platform analytics overview</p>
      </div>

      {/* Stats Overview */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Users</div>
          <div className="admin-stat-value">{stats.overview.totalUsers}</div>
          <div className="admin-stat-change positive">
            +{stats.overview.newUsersLast7Days} past 7 days
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Courses</div>
          <div className="admin-stat-value">{stats.overview.totalCourses}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Certificates Issued</div>
          <div className="admin-stat-value">{stats.overview.totalCertificates}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Active Sessions</div>
          <div className="admin-stat-value">{stats.overview.activeSessions}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="admin-chart-row">
        <div className="admin-section">
          <div className="admin-section-header">
            <h3 className="admin-section-title">Courses by Category</h3>
          </div>
          {stats.coursesByCategory.map((item) => (
            <div key={item.category} className="admin-chart-bar">
              <span className="admin-chart-bar-label">{item.category}</span>
              <div className="admin-chart-bar-track">
                <div
                  className="admin-chart-bar-fill"
                  style={{ width: `${(item.count / maxCategoryCount) * 100}%` }}
                />
              </div>
              <span className="admin-chart-bar-value">{item.count}</span>
            </div>
          ))}
          {stats.coursesByCategory.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No data yet</p>
          )}
        </div>

        <div className="admin-section">
          <div className="admin-section-header">
            <h3 className="admin-section-title">Most Active Courses</h3>
          </div>
          {stats.topCourses.map((c) => (
            <div key={c.courseId} className="admin-chart-bar">
              <span className="admin-chart-bar-label" title={c.title}>{c.title}</span>
              <div className="admin-chart-bar-track">
                <div
                  className="admin-chart-bar-fill"
                  style={{ width: `${(c.progressCount / maxCourseProgress) * 100}%` }}
                />
              </div>
              <span className="admin-chart-bar-value">{c.progressCount}</span>
            </div>
          ))}
          {stats.topCourses.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No activity yet</p>
          )}
        </div>
      </div>

      {/* Breakdowns Row */}
      <div className="admin-chart-row">
        <div className="admin-section">
          <div className="admin-section-header">
            <h3 className="admin-section-title">Users by Role</h3>
          </div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {stats.usersByRole.map((item) => (
              <div key={item.role} style={{
                padding: "1rem 1.5rem",
                borderRadius: "12px",
                background: "rgba(9,9,11,0.4)",
                border: "1px solid rgba(63,63,70,0.3)",
                textAlign: "center",
                flex: "1",
                minWidth: "100px"
              }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-display)" }}>
                  {item.count}
                </div>
                <div className={`admin-badge-status ${item.role.toLowerCase()}`} style={{ marginTop: "0.5rem" }}>
                  {item.role}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-section">
          <div className="admin-section-header">
            <h3 className="admin-section-title">Course Status</h3>
          </div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {stats.coursesByStatus.map((item) => (
              <div key={item.status} style={{
                padding: "1rem 1.5rem",
                borderRadius: "12px",
                background: "rgba(9,9,11,0.4)",
                border: "1px solid rgba(63,63,70,0.3)",
                textAlign: "center",
                flex: "1",
                minWidth: "100px"
              }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-display)" }}>
                  {item.count}
                </div>
                <div className={`admin-badge-status ${item.status.toLowerCase()}`} style={{ marginTop: "0.5rem" }}>
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h3 className="admin-section-title">Recent Users</h3>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div className="admin-user-avatar" style={{ width: 28, height: 28, fontSize: "0.7rem" }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      {user.name}
                    </div>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{user.email}</td>
                  <td>
                    <span className={`admin-badge-status ${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {new Date(user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
