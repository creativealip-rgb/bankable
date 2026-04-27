"use client";

import { useState, useEffect } from "react";

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: any;
  createdAt: string;
  actor: {
    name: string;
    email: string;
  };
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit-logs")
      .then(r => r.json())
      .then(data => setLogs(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Log Audit Admin</h1>
        <p className="admin-page-subtitle">Riwayat aksi yang dilakukan oleh administrator</p>
      </div>

      <div className="admin-section">
        {loading ? (
          <div className="admin-empty">
            <div className="admin-loading-spinner admin-loading-compact" />
            Memuat log...
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Admin</th>
                  <th>Aksi</th>
                  <th>Entitas</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-table-empty">
                      Belum ada riwayat aksi.
                    </td>
                  </tr>
                ) : logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td>
                      <div className="admin-user-name">{log.actor.name}</div>
                      <div className="admin-user-email">{log.actor.email}</div>
                    </td>
                    <td>
                      <span className="admin-badge-status published">
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.85rem", fontWeight: "bold" }}>{log.entityType}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{log.entityId}</div>
                    </td>
                    <td>
                      <pre style={{ 
                        fontSize: "0.7rem", 
                        background: "rgba(0,0,0,0.05)", 
                        padding: "0.5rem", 
                        borderRadius: "5px",
                        maxWidth: "250px",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
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
