"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type PaymentDetail = {
  id: string;
  tier: string;
  provider: string;
  amount: string;
  status: string;
  externalId: string;
  checkoutUrl: string | null;
  createdAt: string;
  paidAt: string | null;
  itemType: "LIFETIME" | "PREMIUM_COURSE";
  itemTitle: string;
  itemSlug: string | null;
  manualInstructions: string | null;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function toLabel(status: string) {
  const v = status.toUpperCase();
  if (v === "PENDING") return "Pending verification";
  if (v === "PAID") return "Paid";
  if (v === "FAILED") return "Failed";
  if (v === "EXPIRED") return "Expired";
  return v;
}

export default function PaymentDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const fetchPayment = async () => {
      try {
        const res = await fetch(`/api/payments/${id}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load payment");
        }
        if (isMounted) {
          setPayment(data);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message || "Failed to load payment");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPayment();
    const interval = setInterval(fetchPayment, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>Loading payment status...</div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p style={{ color: "var(--danger)" }}>{error || "Payment not found."}</p>
          <Link href="/payments" className={styles.link}>Back to payments</Link>
        </div>
      </div>
    );
  }

  const isPending = payment.status.toUpperCase() === "PENDING";
  const isPaid = payment.status.toUpperCase() === "PAID";

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <p className={styles.kicker}>Payment Detail</p>
            <h1 className={styles.title}>{payment.itemTitle}</h1>
          </div>
          <span className={`${styles.badge} ${styles[`badge${payment.status.toUpperCase()}`] || ""}`}>
            {toLabel(payment.status)}
          </span>
        </div>

        <div className={styles.metaGrid}>
          <div><strong>Reference:</strong> {payment.externalId}</div>
          <div><strong>Provider:</strong> {payment.provider}</div>
          <div><strong>Amount:</strong> Rp {Number(payment.amount).toLocaleString("id-ID")}</div>
          <div><strong>Created:</strong> {new Date(payment.createdAt).toLocaleString("id-ID")}</div>
        </div>

        {isPending && payment.provider === "MANUAL" && (
          <div className={styles.notice}>
            <p><strong>Instruksi pembayaran manual:</strong></p>
            <p>{payment.manualInstructions || "Silakan transfer manual dan kirim bukti ke admin."}</p>
            <p className={styles.muted}>Status akan berubah otomatis setelah admin verifikasi.</p>
          </div>
        )}

        {isPending && payment.checkoutUrl && (
          <div className={styles.notice}>
            <p>Pembayaran belum selesai. Lanjutkan checkout di gateway.</p>
            <a href={payment.checkoutUrl} className={styles.primaryBtn}>
              Lanjutkan Pembayaran
            </a>
          </div>
        )}

        {isPaid && (
          <div className={styles.noticeSuccess}>
            Pembayaran berhasil diverifikasi.
            {payment.itemSlug ? (
              <>
                {" "}
                <button type="button" className={styles.inlineBtn} onClick={() => router.push(`/courses/${payment.itemSlug}`)}>
                  Buka detail course
                </button>
              </>
            ) : null}
          </div>
        )}

        <div className={styles.actions}>
          <Link href="/payments" className={styles.link}>Lihat semua pembayaran</Link>
          <button type="button" className={styles.secondaryBtn} onClick={() => window.location.reload()}>
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}

