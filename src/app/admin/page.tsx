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
  memberGrowth: {
    filters: {
      range: string;
      role: string;
      memberStatus: string;
    };
    totals: {
      registered: number;
      becameMember: number;
      conversionRate: number;
      paidMember: number;
      freeOnly: number;
    };
    timeline: {
      periodKey: string;
      periodLabel: string;
      registered: number;
      becameMember: number;
      conversionRate: number;
    }[];
    recentConversions: {
      userId: string;
      name: string;
      email: string;
      role: string;
      tier: string;
      registeredAt: string;
      becameMemberAt: string;
    }[];
  };
  revenue: {
    memberSignup: number;
    premiumWebinar: number;
    total: number;
    memberSignupTransactions: number;
    premiumWebinarTransactions: number;
  };
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30D");
  const [role, setRole] = useState("MEMBER");
  const [memberStatus, setMemberStatus] = useState("ALL");

  useEffect(() => {
    const params = new URLSearchParams({
      range,
      role,
      memberStatus,
    });
    fetch(`/api/admin/stats?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range, role, memberStatus]);

  if (loading) {
    return (
      <div className="admin-empty">
        <div className="admin-loading-spinner admin-loading-compact" />
        Loading analytics...
      </div>
    );
  }

  if (!stats) return <div className="admin-empty">Failed to load analytics</div>;

  const maxCategoryCount = Math.max(...(stats.coursesByCategory.map(c => c.count)), 1);
  const maxCourseProgress = Math.max(...(stats.topCourses.map(c => c.progressCount)), 1);
  const idr = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

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

      <div className="admin-section">
        <div className="admin-section-header">
          <h3 className="admin-section-title">Signup → Member Conversion</h3>
          <div className="admin-toolbar">
            <select className="admin-search-input" value={range} onChange={(event) => setRange(event.target.value)}>
              <option value="7D">7 hari</option>
              <option value="30D">30 hari</option>
              <option value="90D">90 hari</option>
              <option value="180D">180 hari</option>
              <option value="ALL">Semua waktu</option>
            </select>
            <select className="admin-search-input" value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="ALL">Semua role</option>
              <option value="MEMBER">MEMBER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
            <select className="admin-search-input" value={memberStatus} onChange={(event) => setMemberStatus(event.target.value)}>
              <option value="ALL">Semua status</option>
              <option value="PAID_MEMBER">Sudah jadi member</option>
              <option value="FREE_ONLY">Belum jadi member</option>
            </select>
          </div>
        </div>

        <div className="admin-stats-grid admin-stats-grid-3">
          <div className="admin-stat-card">
            <div className="admin-stat-label">User Daftar</div>
            <div className="admin-stat-value">{stats.memberGrowth.totals.registered}</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">Jadi Member</div>
            <div className="admin-stat-value admin-kpi-success">{stats.memberGrowth.totals.becameMember}</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">Conversion Rate</div>
            <div className="admin-stat-value admin-kpi-secondary">{stats.memberGrowth.totals.conversionRate}%</div>
          </div>
        </div>

        <div className="admin-stats-grid admin-stats-grid-3">
          <div className="admin-stat-card">
            <div className="admin-stat-label">Pendapatan Member</div>
            <div className="admin-stat-value">{idr.format(stats.revenue.memberSignup)}</div>
            <div className="admin-stat-change positive">{stats.revenue.memberSignupTransactions} transaksi</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">Pendapatan Webinar Premium</div>
            <div className="admin-stat-value">{idr.format(stats.revenue.premiumWebinar)}</div>
            <div className="admin-stat-change positive">{stats.revenue.premiumWebinarTransactions} transaksi</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">Total Pendapatan</div>
            <div className="admin-stat-value admin-kpi-success">{idr.format(stats.revenue.total)}</div>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Periode</th>
                <th>User Daftar</th>
                <th>Jadi Member</th>
                <th>Conversion</th>
              </tr>
            </thead>
            <tbody>
              {stats.memberGrowth.timeline.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-table-empty">Belum ada data pada filter ini.</td>
                </tr>
              ) : (
                stats.memberGrowth.timeline.map((item) => (
                  <tr key={item.periodKey}>
                    <td>{item.periodLabel}</td>
                    <td>{item.registered}</td>
                    <td>{item.becameMember}</td>
                    <td>{item.conversionRate}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
            <p className="admin-note">No data yet</p>
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
            <p className="admin-note">No activity yet</p>
          )}
        </div>
      </div>

      {/* Breakdowns Row */}
      <div className="admin-chart-row">
        <div className="admin-section">
          <div className="admin-section-header">
            <h3 className="admin-section-title">Users by Role</h3>
          </div>
          <div className="admin-chip-grid">
            {stats.usersByRole.map((item) => (
              <div key={item.role} className="admin-chip-card">
                <div className="admin-chip-value">
                  {item.count}
                </div>
                <div className={`admin-badge-status admin-chip-badge ${item.role.toLowerCase()}`}>
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
          <div className="admin-chip-grid">
            {stats.coursesByStatus.map((item) => (
              <div key={item.status} className="admin-chip-card">
                <div className="admin-chip-value">
                  {item.count}
                </div>
                <div className={`admin-badge-status admin-chip-badge ${item.status.toLowerCase()}`}>
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
                    <div className="admin-inline-row">
                      <div className="admin-user-avatar admin-user-avatar-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      {user.name}
                    </div>
                  </td>
                  <td className="admin-email-cell">{user.email}</td>
                  <td>
                    <span className={`admin-badge-status ${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="admin-email-cell">
                    {new Date(user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h3 className="admin-section-title">Recent Member Conversions</h3>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Tier</th>
                <th>Daftar</th>
                <th>Jadi Member</th>
              </tr>
            </thead>
            <tbody>
              {stats.memberGrowth.recentConversions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-table-empty">Belum ada konversi member.</td>
                </tr>
              ) : (
                stats.memberGrowth.recentConversions.map((row) => (
                  <tr key={row.userId}>
                    <td>
                      <div className="admin-inline-row">
                        <div className="admin-user-avatar admin-user-avatar-sm">{row.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="admin-name-strong">{row.name}</div>
                          <div className="admin-email-cell">{row.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge-status ${row.tier === "LIFETIME" || row.tier === "PREMIUM" || row.tier === "BASIC" ? "published" : "archived"}`}>
                        {row.tier}
                      </span>
                    </td>
                    <td className="admin-email-cell">
                      {new Date(row.registeredAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="admin-email-cell">
                      {new Date(row.becameMemberAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
