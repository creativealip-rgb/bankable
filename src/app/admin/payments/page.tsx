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
  user: { id: string; name: string; email: string };
};

export default function AdminPaymentsPage() {
  const [items, setItems] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadPayments = () => {
    setLoading(true);
    fetch("/api/admin/payments")
      .then((r) => r.json())
      .then((data) => setItems(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPayments();
  }, []);

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
        {feedback ? (
          <div
            role="status"
            style={{
              marginBottom: "1rem",
              borderRadius: "10px",
              border:
                feedback.type === "error"
                  ? "1px solid rgba(248, 113, 113, 0.3)"
                  : "1px solid rgba(52, 211, 153, 0.25)",
              background:
                feedback.type === "error"
                  ? "rgba(248, 113, 113, 0.08)"
                  : "rgba(52, 211, 153, 0.08)",
              color: feedback.type === "error" ? "var(--danger)" : "var(--success)",
              fontSize: "0.86rem",
              lineHeight: 1.5,
              padding: "0.65rem 0.8rem",
            }}
          >
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
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
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
                      <td>{item.status}</td>
                      <td>{new Date(item.createdAt).toLocaleDateString("id-ID")}</td>
                      <td>
                        {item.provider === "MANUAL" && item.status !== "PAID" ? (
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => markAsPaid(item.id)}
                            disabled={updatingId === item.id}
                            style={{ padding: "0.4rem 0.65rem", fontSize: "0.82rem" }}
                          >
                            {updatingId === item.id ? "Saving..." : "Mark Paid"}
                          </button>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>-</span>
                        )}
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

