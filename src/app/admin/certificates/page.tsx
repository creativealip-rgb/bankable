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

  useEffect(() => {
    fetch("/api/admin/certificates")
      .then((r) => r.json())
      .then((data) => setItems(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Certificates</h1>
        <p className="admin-page-subtitle">Issued certificates and public verification links</p>
      </div>

      <div className="admin-section">
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
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
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
                        <div style={{ display: "flex", gap: "0.5rem" }}>
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
      </div>
    </>
  );
}

