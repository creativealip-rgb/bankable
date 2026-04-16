"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

export default function BillingPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"subscription" | "history">("subscription");

  const role = session ? ((session.user as Record<string, unknown>).role as string) : "MEMBER";

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
          Billing & Subscription
        </h1>
        <p style={{ color: "var(--text-muted)" }}>Manage your membership and view payment history.</p>
      </div>

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
              <span style={{ fontSize: "2rem" }}>🆓</span>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700 }}>Free Plan</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Basic access with limited features</div>
              </div>
            </div>
          </div>
          <Link href="/pricing" className="btn-primary" style={{ padding: "12px 24px", fontSize: "0.9rem" }}>
            Upgrade Plan
          </Link>
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
            {tab === "subscription" ? "Subscription Details" : "Payment History"}
          </button>
        ))}
      </div>

      {activeTab === "subscription" ? (
        <div style={{
          background: "var(--surface)", border: "1px solid rgba(63,63,70,0.4)", borderRadius: "20px", padding: "2rem",
        }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", marginBottom: "1.5rem" }}>Subscription Details</h3>
          <div style={{ display: "grid", gap: "1rem" }}>
            {[
              { label: "Plan", value: "Free" },
              { label: "Status", value: "Active", color: "var(--success)" },
              { label: "Member Since", value: session?.user ? new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—" },
              { label: "Next Billing", value: "N/A (Free plan)" },
              { label: "Payment Method", value: "None configured" },
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
        <div style={{
          background: "var(--surface)", border: "1px solid rgba(63,63,70,0.4)", borderRadius: "20px", padding: "2rem",
        }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", marginBottom: "1.5rem" }}>Payment History</h3>
          <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💳</div>
            <p style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>No payment history yet.</p>
            <p style={{ fontSize: "0.85rem" }}>
              Your transactions will appear here once you upgrade to a paid plan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
