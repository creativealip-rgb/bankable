"use client";

import { useState, useEffect } from "react";
import { useSession, signOut, authClient } from "@/lib/auth-client";
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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

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
        setError(data.error || "Gagal memperbarui profil");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      setError("Gagal memperbarui profil");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Hapus akun Anda secara permanen? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const res = await fetch("/api/me", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Gagal menghapus akun");
        return;
      }

      await signOut();
      router.replace("/");
      router.refresh();
    } catch (deleteError) {
      console.error("Failed to delete account:", deleteError);
      setError("Gagal menghapus akun");
    } finally {
      setDeleting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordChanged(false);
    setError("");

    try {
      const { error } = await authClient.changePassword({
        newPassword: newPassword,
        currentPassword: currentPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        setError(error.message || "Gagal mengganti kata sandi");
      } else {
        setPasswordChanged(true);
        setCurrentPassword("");
        setNewPassword("");
        setTimeout(() => setPasswordChanged(false), 3000);
      }
    } catch (err) {
      console.error("Failed to change password:", err);
      setError("Terjadi kesalahan sistem");
    } finally {
      setChangingPassword(false);
    }
  };

  const role = session ? ((session.user as Record<string, unknown>).role as string) : "MEMBER";

  return (
    <div className={styles.profileContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Profil Saya</h1>
        <p style={{ color: "var(--text-muted)" }}>Kelola informasi akun dan preferensi Anda.</p>
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
              <div className={styles.avatarName}>{name || "Nama Anda"}</div>
              <div className={styles.avatarEmail}>{email}</div>
              <span className={styles.memberBadge}>{role}</span>
            </div>
          </div>

          {/* Form Fields */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nama Lengkap</label>
              <input
                type="text"
                className={styles.formInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama Anda"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Alamat Email</label>
              <input
                type="email"
                className={styles.formInput}
                value={email}
                disabled
                title="Email tidak dapat diubah"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Peran</label>
            <input
              type="text"
              className={styles.formInput}
              value={role}
              disabled
            />
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
            {saved && (
              <span className={styles.successMsg}>
                ✓ Profil berhasil diperbarui
              </span>
            )}
          </div>
        </div>
      </form>

      {/* Security Section */}
      <div className={styles.profileCard} style={{ marginTop: "1rem" }}>
        <h3 className={styles.sectionTitle}>Keamanan</h3>
        <p className={styles.sectionDesc}>Ganti kata sandi akun Anda secara berkala.</p>
        
        <form onSubmit={handleChangePassword}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Kata Sandi Saat Ini</label>
              <input
                type="password"
                className={styles.formInput}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Kata Sandi Baru</label>
              <input
                type="password"
                className={styles.formInput}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: "1rem" }}>
            <button type="submit" className={styles.saveBtn} disabled={changingPassword}>
              {changingPassword ? "Memperbarui..." : "Ganti Kata Sandi"}
            </button>
            {passwordChanged && (
              <span className={styles.successMsg}>
                ✓ Kata sandi berhasil diperbarui
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className={styles.dangerZone}>
        <div className={styles.dangerTitle}>Zona Berbahaya</div>
        <p className={styles.dangerText}>
          Setelah Anda menghapus akun, tindakan ini tidak dapat dibatalkan. Semua progres, sertifikat, dan data Anda akan dihapus secara permanen.
        </p>
        <button
          type="button"
          className={styles.dangerBtn}
          onClick={handleDeleteAccount}
          disabled={deleting}
        >
          {deleting ? "Menghapus..." : "Hapus Akun"}
        </button>
      </div>
    </div>
  );
}
