"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import styles from "./page.module.css";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const role = session ? ((session.user as Record<string, unknown>).role as string) : "MEMBER";

  return (
    <div className={styles.profileContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Profile</h1>
        <p style={{ color: "var(--text-muted)" }}>Manage your account information and preferences.</p>
      </div>

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
        <button type="button" className={styles.dangerBtn}>
          Delete Account
        </button>
      </div>
    </div>
  );
}
