"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { useToast } from "../toast-provider";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl");
  const safeCallbackUrl =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Email atau password salah");
        toast(result.error.message || "Gagal masuk. Cek email dan password Anda.", "error");
      } else {
        toast("Berhasil masuk! Selamat datang kembali.", "success");
        router.push(safeCallbackUrl);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan sistem");
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
            Selamat <span className="gradient-text">Datang</span>
          </h1>
          <p className={styles.authSubtitle}>
            Masuk untuk melanjutkan perjalanan belajarmu
          </p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.authForm}>
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
            <label htmlFor="password" className={styles.label}>Password</label>
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

          <button
            type="submit"
            className={`btn-primary ${styles.submitButton}`}
            disabled={loading}
          >
            {loading ? "Sedang masuk..." : "Masuk"}
          </button>
        </form>

        <p className={styles.authFooter}>
          Belum punya akun?{" "}
          <Link href="/register" className={styles.authLink}>Daftar</Link>
        </p>
      </div>
    </div>
  );
}
