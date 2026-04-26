"use client";

import { useEffect, useState } from "react";

type AdminSettings = {
  paymentMode: "MANUAL" | "GATEWAY";
  paymentProvider: string;
  manualInstructions: string;
  manualEtaHours: number;
  supportContact: string;
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
        <div className="admin-loading-spinner admin-loading-compact" />
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
            manualEtaHours: settings.manualEtaHours,
            supportContact: settings.supportContact,
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
        <div className="admin-grid-two admin-toolbar-spaced">
          <label className="admin-grid-full admin-form-field">
            <span className="admin-field-label">Payment Mode</span>
            <select
              value={settings.paymentMode}
              onChange={(e) =>
                setSettings((prev) => (prev ? { ...prev, paymentMode: e.target.value as "MANUAL" | "GATEWAY" } : prev))
              }
              className="admin-search-input admin-input-full"
            >
              <option value="MANUAL">MANUAL (tanpa gateway)</option>
              <option value="GATEWAY">GATEWAY (Midtrans/Xendit)</option>
            </select>
          </label>

          <label className="admin-form-field">
            <span className="admin-field-label">Gateway Provider</span>
            <select
              value={settings.paymentProvider}
              onChange={(e) => setSettings((prev) => (prev ? { ...prev, paymentProvider: e.target.value } : prev))}
              className="admin-search-input admin-input-full"
              disabled={settings.paymentMode !== "GATEWAY"}
            >
              <option value="MIDTRANS">MIDTRANS</option>
              <option value="XENDIT">XENDIT</option>
            </select>
          </label>

          <label className="admin-grid-full admin-form-field">
            <span className="admin-field-label">Manual Payment Instructions</span>
            <textarea
              value={settings.manualInstructions}
              onChange={(e) => setSettings((prev) => (prev ? { ...prev, manualInstructions: e.target.value } : prev))}
              rows={4}
              placeholder="Contoh: Transfer ke BCA 123xxx a.n. BELAJARIA, lalu kirim bukti ke WhatsApp admin."
              className="admin-search-input admin-input-full admin-textarea"
            />
          </label>

          <label className="admin-form-field">
            <span className="admin-field-label">Manual ETA (hours)</span>
            <input
              type="number"
              min={1}
              max={168}
              value={settings.manualEtaHours}
              onChange={(e) =>
                setSettings((prev) =>
                  prev ? { ...prev, manualEtaHours: Number(e.target.value) || 24 } : prev
                )
              }
              className="admin-search-input admin-input-full"
            />
          </label>

          <label className="admin-form-field">
            <span className="admin-field-label">Support Contact</span>
            <input
              type="text"
              value={settings.supportContact}
              onChange={(e) => setSettings((prev) => (prev ? { ...prev, supportContact: e.target.value } : prev))}
              placeholder="WA admin / email support"
              className="admin-search-input admin-input-full"
            />
          </label>

          <div className="admin-grid-full admin-row">
            <button type="button" onClick={handleSave} className="btn-primary admin-btn-compact" disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </button>
            {message ? <span className="admin-note">{message}</span> : null}
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <tbody>
              <tr><td>Payment Mode</td><td>{settings.paymentMode}</td></tr>
              <tr><td>Payment Provider</td><td>{settings.paymentProvider}</td></tr>
              <tr><td>Manual ETA (hours)</td><td>{settings.manualEtaHours}</td></tr>
              <tr><td>Support Contact</td><td>{settings.supportContact || "-"}</td></tr>
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

