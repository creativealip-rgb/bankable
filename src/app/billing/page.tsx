"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type MembershipRecord = {
  id: string;
  tier: string;
  status: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
};

type BillingData = {
  currentMembership: MembershipRecord | null;
  history: MembershipRecord[];
};

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<"subscription" | "history">("subscription");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [billing, setBilling] = useState<BillingData>({ currentMembership: null, history: [] });

  const currentMembership = useMemo(
    () => billing.currentMembership || { tier: "FREE", status: "ACTIVE", startDate: "", endDate: null },
    [billing.currentMembership]
  );

  const fetchBilling = async () => {
    setError("");
    try {
      const res = await fetch("/api/billing");
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load billing data.");
        return;
      }

      const data = await res.json();
      setBilling(data);
    } catch {
      setError("Failed to load billing data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const cancelMembership = async () => {
    if (!confirm("Cancel your current membership?")) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/billing", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to cancel membership.");
        return;
      }
      await fetchBilling();
    } catch {
      setError("Failed to cancel membership.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading billing data...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
          Billing & Subscription
        </h1>
        <p style={{ color: "var(--text-muted)" }}>Manage your membership and view plan history.</p>
      </div>

      {error && (
        <div style={{
          marginBottom: "1rem",
          color: "var(--danger)",
          background: "rgba(248,113,113,0.1)",
          border: "1px solid rgba(248,113,113,0.3)",
          borderRadius: "10px",
          padding: "0.75rem 1rem",
          fontSize: "0.9rem",
        }}>
          {error}
        </div>
      )}

      {/* Current Plan */}
      <div style={{
        background: "var(--surface)", border: "1px solid rgba(63,63,70,0.4)", borderRadius: "20px",
        padding: "2rem", marginBottom: "1.5rem", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, var(--primary), var(--secondary))" }}></div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, marginBottom: "1.5rem" }}>Current Plan</h2>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "2rem" }}>{currentMembership.tier === "FREE" ? "🆓" : "💎"}</span>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700 }}>
                  {currentMembership.tier} Plan
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  Status: <span style={{ color: currentMembership.status === "ACTIVE" ? "var(--success)" : "var(--warning)" }}>{currentMembership.status}</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href="/pricing" className="btn-primary" style={{ padding: "12px 24px", fontSize: "0.9rem" }}>
              Change Plan
            </Link>
            {currentMembership.tier !== "FREE" && currentMembership.status === "ACTIVE" && (
              <button
                onClick={cancelMembership}
                disabled={saving}
                className="btn-secondary"
                style={{ padding: "12px 24px", fontSize: "0.9rem", color: "var(--danger)", borderColor: "rgba(248,113,113,0.4)" }}
              >
                {saving ? "Cancelling..." : "Cancel Plan"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {(["subscription", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 20px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 500,
              cursor: "pointer", transition: "all 0.25s ease",
              background: activeTab === tab ? "rgba(34,211,238,0.1)" : "var(--surface)",
              border: `1px solid ${activeTab === tab ? "rgba(34,211,238,0.35)" : "rgba(63,63,70,0.4)"}`,
              color: activeTab === tab ? "var(--primary)" : "var(--text-muted)",
            }}
          >
            {tab === "subscription" ? "Subscription Details" : "Plan History"}
          </button>
        ))}
      </div>

      {activeTab === "subscription" ? (
        <div style={{ background: "var(--surface)", border: "1px solid rgba(63,63,70,0.4)", borderRadius: "20px", padding: "2rem" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", marginBottom: "1.5rem" }}>Subscription Details</h3>
          <div style={{ display: "grid", gap: "1rem" }}>
            {[
              { label: "Plan", value: currentMembership.tier },
              { label: "Status", value: currentMembership.status, color: currentMembership.status === "ACTIVE" ? "var(--success)" : "var(--warning)" },
              { label: "Started On", value: formatDate(currentMembership.startDate) },
              { label: "Ends On", value: currentMembership.endDate ? formatDate(currentMembership.endDate) : "No expiry" },
              { label: "Billing Model", value: currentMembership.tier === "LIFETIME" ? "One-time purchase" : currentMembership.tier === "FREE" ? "No payment required" : "Recurring monthly" },
            ].map((item) => (
              <div key={item.label} style={{
                display: "flex", justifyContent: "space-between", padding: "0.75rem 0",
                borderBottom: "1px solid rgba(63,63,70,0.2)", fontSize: "0.9rem",
              }}>
                <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
                <span style={{ fontWeight: 600, color: item.color || "var(--text-main)" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid rgba(63,63,70,0.4)", borderRadius: "20px", padding: "2rem" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", marginBottom: "1.5rem" }}>Membership History</h3>
          {billing.history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)" }}>
              No membership history yet.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {billing.history.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    border: "1px solid rgba(63,63,70,0.3)",
                    borderRadius: "12px",
                    padding: "0.9rem 1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{entry.tier}</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      Started {formatDate(entry.startDate)}{entry.endDate ? ` • Ended ${formatDate(entry.endDate)}` : ""}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: entry.status === "ACTIVE" ? "var(--success)" : "var(--warning)" }}>
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
