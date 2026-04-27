"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useToast } from "../toast-provider";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../login/page.module.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Token reset tidak valid atau sudah kadaluarsa.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast("Kata sandi tidak cocok.", "error");
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token: token || "",
      });

      if (error) {
        toast(error.message || "Gagal mengatur ulang kata sandi.", "error");
      } else {
        toast("Kata sandi berhasil diubah! Silakan masuk.", "success");
        router.push("/login");
      }
    } catch {
      toast("Terjadi kesalahan sistem.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <h1 className={styles.authTitle}>Error</h1>
            <p className={styles.authSubtitle}>{error}</p>
          </div>
          <Link href="/forgot-password" title="Coba Lagi" className="btn-primary" style={{ textAlign: "center" }}>
            Minta Link Baru
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>
            Reset <span className="gradient-text">Kata Sandi</span>
          </h1>
          <p className={styles.authSubtitle}>
            Masukkan kata sandi baru Anda
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Kata Sandi Baru</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>Konfirmasi Kata Sandi</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className={styles.input}
            />
          </div>

          <button
            type="submit"
            className={`btn-primary ${styles.submitButton}`}
            disabled={loading}
          >
            {loading ? "Menyimpan..." : "Simpan Kata Sandi"}
          </button>
        </form>
      </div>
    </div>
  );
}
