"use client";

import { useEffect, useState } from "react";

type AdminSettings = {
  paymentMode: "MANUAL" | "GATEWAY";
  paymentProvider: string;
  manualInstructions: string;
  hasMidtransKey: boolean;
  hasXenditKey: boolean;
  appUrl: string;
  webhooks: { payments: string };
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  if (!settings) {
    return (
      <div className="admin-empty">
        <div className="admin-loading-spinner" style={{ margin: "0 auto 1rem" }} />
        Loading settings...
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMode: settings.paymentMode,
          paymentProvider: settings.paymentProvider,
          manualInstructions: settings.manualInstructions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings");
      }
      setMessage("Settings saved.");
    } catch (error) {
      setMessage((error as Error).message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Settings</h1>
        <p className="admin-page-subtitle">Runtime configuration visibility for operators</p>
      </div>
      <div className="admin-section">
        <div style={{ display: "grid", gap: "0.85rem", marginBottom: "1rem" }}>
          <label style={{ display: "grid", gap: "0.4rem", maxWidth: "320px" }}>
            <span style={{ fontWeight: 600, color: "var(--text-main)" }}>Payment Mode</span>
            <select
              value={settings.paymentMode}
              onChange={(e) =>
                setSettings((prev) => (prev ? { ...prev, paymentMode: e.target.value as "MANUAL" | "GATEWAY" } : prev))
              }
              style={{ padding: "0.55rem 0.75rem", borderRadius: "10px", border: "1px solid var(--border-light)" }}
            >
              <option value="MANUAL">MANUAL (tanpa gateway)</option>
              <option value="GATEWAY">GATEWAY (Midtrans/Xendit)</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: "0.4rem", maxWidth: "320px" }}>
            <span style={{ fontWeight: 600, color: "var(--text-main)" }}>Gateway Provider</span>
            <select
              value={settings.paymentProvider}
              onChange={(e) => setSettings((prev) => (prev ? { ...prev, paymentProvider: e.target.value } : prev))}
              style={{ padding: "0.55rem 0.75rem", borderRadius: "10px", border: "1px solid var(--border-light)" }}
              disabled={settings.paymentMode !== "GATEWAY"}
            >
              <option value="MIDTRANS">MIDTRANS</option>
              <option value="XENDIT">XENDIT</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: "0.4rem" }}>
            <span style={{ fontWeight: 600, color: "var(--text-main)" }}>Manual Payment Instructions</span>
            <textarea
              value={settings.manualInstructions}
              onChange={(e) => setSettings((prev) => (prev ? { ...prev, manualInstructions: e.target.value } : prev))}
              rows={4}
              placeholder="Contoh: Transfer ke BCA 123xxx a.n. Bankable, lalu kirim bukti ke WhatsApp admin."
              style={{ padding: "0.65rem 0.8rem", borderRadius: "10px", border: "1px solid var(--border-light)" }}
            />
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button type="button" onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </button>
            {message ? <span style={{ color: "var(--text-muted)" }}>{message}</span> : null}
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <tbody>
              <tr><td>Payment Mode</td><td>{settings.paymentMode}</td></tr>
              <tr><td>Payment Provider</td><td>{settings.paymentProvider}</td></tr>
              <tr><td>Midtrans Key Configured</td><td>{String(settings.hasMidtransKey)}</td></tr>
              <tr><td>Xendit Key Configured</td><td>{String(settings.hasXenditKey)}</td></tr>
              <tr><td>App URL</td><td>{settings.appUrl}</td></tr>
              <tr><td>Payments Webhook</td><td>{settings.webhooks.payments}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

