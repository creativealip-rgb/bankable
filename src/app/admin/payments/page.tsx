"use client";

import { useEffect, useState } from "react";

type AdminPayment = {
  id: string;
  provider: string;
  tier: string;
  amount: string;
  status: string;
  externalId: string;
  createdAt: string;
  paidAt: string | null;
  paymentProofUrl: string | null;
  paymentProofName: string | null;
  paymentProofNote: string | null;
  paymentProofSubmittedAt: string | null;
  paymentProofVerifiedAt: string | null;
  user: { id: string; name: string; email: string };
};

export default function AdminPaymentsPage() {
  const [items, setItems] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [provider, setProvider] = useState("");

  const loadPayments = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "20",
    });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (provider) params.set("provider", provider);

    fetch(`/api/admin/payments?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotalPages(Math.max(1, Number(data.pagination?.totalPages || 1)));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPayments();
  }, [page, q, status, provider]);

  const markAsPaid = async (paymentId: string) => {
    if (updatingId) return;
    setUpdatingId(paymentId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update payment");
      }
      loadPayments();
        setFeedback({ type: "success", message: "Status pembayaran berhasil diperbarui." });
    } catch (error) {
      setFeedback({ type: "error", message: (error as Error).message || "Failed to update payment" });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Payments</h1>
        <p className="admin-page-subtitle">Gateway transactions and payment statuses</p>
      </div>

      <div className="admin-section">
        <div className="admin-toolbar admin-toolbar-spaced">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search external ID..."
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
          />
          <select
            className="admin-search-input"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">All Status</option>
            <option value="PENDING">PENDING</option>
            <option value="PAID">PAID</option>
            <option value="FAILED">FAILED</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
          <select
            className="admin-search-input"
            value={provider}
            onChange={(e) => {
              setPage(1);
              setProvider(e.target.value);
            }}
          >
            <option value="">All Provider</option>
            <option value="MANUAL">MANUAL</option>
            <option value="MIDTRANS">MIDTRANS</option>
            <option value="XENDIT">XENDIT</option>
          </select>
        </div>
        {feedback ? (
          <div role="status" className={`admin-feedback ${feedback.type}`}>
            {feedback.message}
          </div>
        ) : null}
        {loading ? (
          <div className="admin-empty">Loading payments...</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>External ID</th>
                  <th>Member</th>
                  <th>Tier</th>
                  <th>Provider</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Proof</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="admin-table-empty">
                      No payments yet
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.externalId}</td>
                      <td>{item.user.name}</td>
                      <td>{item.tier}</td>
                      <td>{item.provider}</td>
                      <td>Rp {Number(item.amount).toLocaleString("id-ID")}</td>
                      <td>
                        <span className={`admin-badge-status ${item.status.toLowerCase()}`}>{item.status}</span>
                      </td>
                      <td>
                        {item.paymentProofUrl ? (
                          <div className="admin-row-actions">
                            <a
                              href={item.paymentProofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="admin-filter-btn admin-table-btn active"
                            >
                              Lihat Bukti
                            </a>
                            {item.paymentProofSubmittedAt ? (
                              <span className="admin-muted">
                                {new Date(item.paymentProofSubmittedAt).toLocaleDateString("id-ID")}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="admin-table-placeholder">Belum ada</span>
                        )}
                        {item.paymentProofNote ? (
                          <div className="admin-note">{item.paymentProofNote}</div>
                        ) : null}
                      </td>
                      <td>{new Date(item.createdAt).toLocaleDateString("id-ID")}</td>
                      <td>
                        {item.provider === "MANUAL" && item.status !== "PAID" ? (
                          <button
                            type="button"
                            className="btn-primary admin-table-btn"
                            onClick={() => markAsPaid(item.id)}
                            disabled={updatingId === item.id || !item.paymentProofUrl}
                          >
                            {updatingId === item.id ? "Saving..." : "Verifikasi & Mark Paid"}
                          </button>
                        ) : (
                          <span className="admin-table-placeholder">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="admin-pagination">
          <button className="admin-filter-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            ← Prev
          </button>
          <span className="admin-pagination-label">
            Page {page} / {totalPages}
          </span>
          <button className="admin-filter-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            Next →
          </button>
        </div>
      </div>
    </>
  );
}

