"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useToast } from "../toast-provider";
import Link from "next/link";
import styles from "../login/page.module.css";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // framework: Better Auth emailOTP plugin - send reset OTP
      const { error } = await authClient.forgetPassword.emailOtp({
        email,
      });

      if (error) {
        toast(error.message || "Gagal mengirim permintaan reset password.", "error");
      } else {
        setSent(true);
        toast("Instruksi reset password telah dikirim ke email Anda.", "success");
      }
    } catch {
      toast("Terjadi kesalahan sistem. Coba lagi nanti.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>
            Lupa <span className="gradient-text">Kata Sandi?</span>
          </h1>
          <p className={styles.authSubtitle}>
            Masukkan email Anda untuk menerima instruksi reset kata sandi
          </p>
        </div>

        {sent ? (
          <div className={styles.successBox}>
            <p>Instruksi telah dikirim! Silakan periksa kotak masuk email Anda (termasuk folder spam).</p>
            <Link href="/login" className="btn-secondary" style={{ marginTop: "1rem", width: "100%", textAlign: "center" }}>
              Kembali ke Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.authForm}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email Terdaftar</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={styles.input}
              />
            </div>

            <button
              type="submit"
              className={`btn-primary ${styles.submitButton}`}
              disabled={loading}
            >
              {loading ? "Mengirim..." : "Kirim Link Reset"}
            </button>
          </form>
        )}

        {!sent && (
          <p className={styles.authFooter}>
            Ingat kata sandi Anda?{" "}
            <Link href="/login" className={styles.authLink}>Masuk</Link>
          </p>
        )}
      </div>
    </div>
  );
}
