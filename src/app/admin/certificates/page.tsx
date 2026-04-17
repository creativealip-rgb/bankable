"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AdminCert = {
  id: string;
  certificateNumber: string;
  score: string;
  issuedAt: string;
  user: { id: string; name: string; email: string };
  course: { id: string; title: string; slug: string };
};

export default function AdminCertificatesPage() {
  const [items, setItems] = useState<AdminCert[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "20",
    });
    if (q) params.set("q", q);
    fetch(`/api/admin/certificates?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotalPages(Math.max(1, Number(data.pagination?.totalPages || 1)));
      })
      .finally(() => setLoading(false));
  }, [page, q]);

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Certificates</h1>
        <p className="admin-page-subtitle">Issued certificates and public verification links</p>
      </div>

      <div className="admin-section">
        <div className="admin-toolbar admin-toolbar-spaced">
          <input
            className="admin-search-input"
            placeholder="Search certificate number..."
            value={q}
            onChange={(e) => {
              setLoading(true);
              setPage(1);
              setQ(e.target.value);
            }}
          />
        </div>
        {loading ? (
          <div className="admin-empty">Loading certificates...</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Certificate ID</th>
                  <th>Member</th>
                  <th>Course</th>
                  <th>Score</th>
                  <th>Issued</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-table-empty">
                      No certificates yet
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.certificateNumber}</td>
                      <td>{item.user.name}</td>
                      <td>{item.course.title}</td>
                      <td>{Number(item.score).toFixed(0)}%</td>
                      <td>{new Date(item.issuedAt).toLocaleDateString("id-ID")}</td>
                      <td>
                        <div className="admin-row-actions">
                          <Link href={`/verify/${item.certificateNumber}`} className="admin-filter-btn active">
                            Verify
                          </Link>
                          <a href={`/api/certificates/${item.certificateNumber}/pdf`} className="admin-filter-btn">
                            PDF
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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

