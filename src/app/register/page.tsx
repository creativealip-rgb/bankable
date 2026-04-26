"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import Link from "next/link";
import { useToast } from "../toast-provider";
import styles from "../login/page.module.css";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Password tidak sama");
      return;
    }

    setLoading(true);

    try {
      const result = await signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Gagal membuat akun");
        toast(result.error.message || "Gagal membuat akun. Silakan coba lagi.", "error");
      } else {
        toast("Akun berhasil dibuat! Silakan selesaikan pembayaran.", "success");
        setPaymentInfo("Akun berhasil dibuat. Mengarahkan ke halaman pembayaran...");
        const checkoutRes = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: "LIFETIME" }),
        });
        if (!checkoutRes.ok) {
          const data = await checkoutRes.json();
          setError(data.error || "Gagal membuat checkout pembayaran.");
          return;
        }
        const checkout = await checkoutRes.json();
        if (!checkout.paymentId) {
          setError("Payment reference tidak tersedia.");
          return;
        }
        router.push(`/payments/${checkout.paymentId}`);
      }
    } catch {
      setError("Terjadi kesalahan yang tidak terduga");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>
            Gabung <span className="gradient-text">BELAJARIA</span>
          </h1>
          <p className={styles.authSubtitle}>
            Sekali bayar Rp29.000 saat daftar untuk akses semua course, ebook, dan voice SFX
          </p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {paymentInfo && (
          <div
            style={{
              marginBottom: "1rem",
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              border: "1px solid rgba(52,211,153,0.35)",
              background: "rgba(52,211,153,0.1)",
              color: "var(--success)",
              fontSize: "0.9rem",
            }}
          >
            {paymentInfo}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>Nama Lengkap</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kamu"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
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

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Kata Sandi</label>
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
            <label htmlFor="confirmPassword" className={styles.label}>
              Konfirmasi Kata Sandi
            </label>
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
            {loading ? "Memproses..." : "Daftar & Bayar Rp29.000"}
          </button>
        </form>

        <p className={styles.authFooter}>
          Sudah punya akun?{" "}
          <Link href="/login" className={styles.authLink}>Masuk</Link>
        </p>
      </div>
    </div>
  );
}
