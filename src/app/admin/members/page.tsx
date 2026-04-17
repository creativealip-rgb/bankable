"use client";

import { useEffect, useMemo, useState } from "react";

type MemberRow = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  membership: string;
  certificateCount: number;
  videosWatched: number;
  totalProgress: number;
};

const TIER_OPTIONS = ["ALL", "FREE", "BASIC", "PREMIUM", "LIFETIME"] as const;

export default function AdminMembersPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<(typeof TIER_OPTIONS)[number]>("ALL");

  useEffect(() => {
    let ignore = false;

    const params = new URLSearchParams({
      role: "MEMBER",
      page: "1",
      pageSize: "250",
    });

    fetch(`/api/admin/users?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        setMembers(Array.isArray(data.items) ? data.items : []);
      })
      .catch(console.error)
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return members.filter((member) => {
      const matchesTier = tier === "ALL" ? true : member.membership === tier;
      const matchesSearch =
        query.length === 0 ||
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query);
      return matchesTier && matchesSearch;
    });
  }, [members, search, tier]);

  const membershipCounts = useMemo(
    () =>
      members.reduce((acc, member) => {
        acc[member.membership] = (acc[member.membership] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    [members]
  );

  const membershipBars = Object.entries(membershipCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...membershipBars.map(([, count]) => count), 1);
  const paidMembers = members.filter((member) => member.membership !== "FREE").length;
  const avgCertificates = filteredMembers.length
    ? (filteredMembers.reduce((sum, member) => sum + member.certificateCount, 0) / filteredMembers.length).toFixed(1)
    : "0.0";

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Members</h1>
        <p className="admin-page-subtitle">Membership overview and learning engagement for member accounts.</p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Members</div>
          <div className="admin-stat-value">{members.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Paid Members</div>
          <div className="admin-stat-value admin-kpi-secondary">{paidMembers}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Filtered Results</div>
          <div className="admin-stat-value">{filteredMembers.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Avg Certificates</div>
          <div className="admin-stat-value admin-kpi-warning">{avgCertificates}</div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h3 className="admin-section-title">Membership Distribution</h3>
        </div>
        {membershipBars.length > 0 ? (
          membershipBars.map(([name, count]) => (
            <div key={name} className="admin-chart-bar">
              <span className="admin-chart-bar-label">{name}</span>
              <div className="admin-chart-bar-track">
                <div className="admin-chart-bar-fill" style={{ width: `${(count / maxCount) * 100}%` }} />
              </div>
              <span className="admin-chart-bar-value">{count}</span>
            </div>
          ))
        ) : (
          <p className="admin-muted">No membership data available.</p>
        )}
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h3 className="admin-section-title">Member List</h3>
          <div className="admin-toolbar">
            <div className="admin-form-inline">
              <input
                className="admin-search-input"
                placeholder="Search name or email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select
                className="admin-search-input"
                value={tier}
                onChange={(event) => setTier(event.target.value as (typeof TIER_OPTIONS)[number])}
              >
                {TIER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "ALL" ? "All Tiers" : option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="admin-empty">
            <div className="admin-loading-spinner admin-loading-inline" />
            Loading members...
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Membership</th>
                  <th>Videos Watched</th>
                  <th>Certificates</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-table-empty">
                      No members found
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="admin-inline-row">
                          <div className="admin-user-avatar admin-user-avatar-sm">{member.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <div className="admin-name-strong">{member.name}</div>
                            <div className="admin-email-cell">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`admin-badge-status ${
                            member.membership === "LIFETIME" || member.membership === "PREMIUM"
                              ? "published"
                              : member.membership === "BASIC"
                                ? "draft"
                                : "archived"
                          }`}
                        >
                          {member.membership}
                        </span>
                      </td>
                      <td>
                        <div className="admin-inline-row">
                          <div className="admin-progress-track">
                            <div
                              className="admin-progress-fill"
                              style={{ width: `${Math.min((member.videosWatched / Math.max(member.totalProgress, 1)) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="admin-muted">
                            {member.videosWatched}
                            {member.totalProgress > 0 ? `/${member.totalProgress}` : ""}
                          </span>
                        </div>
                      </td>
                      <td>
                        {member.certificateCount > 0 ? (
                          <span className="admin-crown">🏆 {member.certificateCount}</span>
                        ) : (
                          <span className="admin-table-placeholder">—</span>
                        )}
                      </td>
                      <td className="admin-email-cell">
                        {new Date(member.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
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

