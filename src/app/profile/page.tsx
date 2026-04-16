"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Delete your account permanently? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const res = await fetch("/api/me", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete account");
        return;
      }

      await signOut();
      router.replace("/");
      router.refresh();
    } catch (deleteError) {
      console.error("Failed to delete account:", deleteError);
      setError("Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  const role = session ? ((session.user as Record<string, unknown>).role as string) : "MEMBER";

  return (
    <div className={styles.profileContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Profile</h1>
        <p style={{ color: "var(--text-muted)" }}>Manage your account information and preferences.</p>
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

      <form onSubmit={handleSave}>
        <div className={styles.profileCard}>
          {/* Avatar Section */}
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              {name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className={styles.avatarInfo}>
              <div className={styles.avatarName}>{name || "Your Name"}</div>
              <div className={styles.avatarEmail}>{email}</div>
              <span className={styles.memberBadge}>{role}</span>
            </div>
          </div>

          {/* Form Fields */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Full Name</label>
              <input
                type="text"
                className={styles.formInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email Address</label>
              <input
                type="email"
                className={styles.formInput}
                value={email}
                disabled
                title="Email cannot be changed"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Role</label>
            <input
              type="text"
              className={styles.formInput}
              value={role}
              disabled
            />
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {saved && (
              <span className={styles.successMsg}>
                ✓ Profile updated successfully
              </span>
            )}
          </div>
        </div>
      </form>

      {/* Danger Zone */}
      <div className={styles.dangerZone}>
        <div className={styles.dangerTitle}>Danger Zone</div>
        <p className={styles.dangerText}>
          Once you delete your account, there is no going back. All your progress, certificates, and data will be permanently removed.
        </p>
        <button
          type="button"
          className={styles.dangerBtn}
          onClick={handleDeleteAccount}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </div>
  );
}
