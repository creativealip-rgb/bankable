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
  estimatedVerificationMinutes: number;
  supportContact: string;
  paymentProofUrl: string | null;
  paymentProofName: string | null;
  paymentProofNote: string | null;
  paymentProofSubmittedAt: string | null;
  paymentProofVerifiedAt: string | null;
  paymentProofRejectReason: string | null;
  paymentProofRejectedAt: string | null;
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

type FlowState = "done" | "active" | "todo" | "error";
type PaymentFlow = { title: string; hint: string; state: FlowState };

function getPaymentFlow(status: string): PaymentFlow[] {
  const v = status.toUpperCase();

  if (v === "PAID") {
    return [
      { title: "Dibuat", hint: "Order berhasil dibuat.", state: "done" },
      { title: "Pembayaran", hint: "Pembayaran berhasil diterima.", state: "done" },
      { title: "Verifikasi", hint: "Status sudah tervalidasi sistem/admin.", state: "done" },
      { title: "Akses Aktif", hint: "Konten sudah bisa diakses.", state: "active" },
    ];
  }

  if (v === "FAILED" || v === "EXPIRED") {
    return [
      { title: "Dibuat", hint: "Order berhasil dibuat.", state: "done" },
      { title: "Pembayaran", hint: "Pembayaran tidak terselesaikan.", state: "error" },
      { title: "Verifikasi", hint: "Tidak bisa lanjut sebelum pembayaran berhasil.", state: "todo" },
      { title: "Akses Aktif", hint: "Belum aktif.", state: "todo" },
    ];
  }

  return [
    { title: "Dibuat", hint: "Order berhasil dibuat.", state: "done" },
    { title: "Pembayaran", hint: "Menunggu kamu menyelesaikan pembayaran.", state: "active" },
    { title: "Verifikasi", hint: "Status akan diperbarui otomatis/admin.", state: "todo" },
    { title: "Akses Aktif", hint: "Akan aktif setelah status PAID.", state: "todo" },
  ];
}

export default function PaymentDetailPage({ params }: PageProps) {
  const MAX_PROOF_SIZE_BYTES = 8 * 1024 * 1024;
  const router = useRouter();
  const [id, setId] = useState("");
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofNote, setProofNote] = useState("");
  const [proofSubmitting, setProofSubmitting] = useState(false);
  const [proofFeedback, setProofFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
  }, [id, refreshTick]);

  const uploadProof = async () => {
    if (!id || !proofFile || proofSubmitting) return;
    if (proofFile.size > MAX_PROOF_SIZE_BYTES) {
      setProofFeedback({ type: "error", text: "Ukuran file melebihi batas 8MB." });
      return;
    }

    setProofSubmitting(true);
    setProofFeedback(null);
    try {
      const form = new FormData();
      form.set("file", proofFile);
      if (proofNote.trim()) form.set("note", proofNote.trim());

      const res = await fetch(`/api/payments/${id}/proof`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal upload bukti pembayaran.");
      }
      setProofFeedback({ type: "success", text: "Bukti pembayaran berhasil diupload." });
      setProofFile(null);
      setRefreshTick((n) => n + 1);
    } catch (err) {
      setProofFeedback({ type: "error", text: (err as Error).message || "Gagal upload bukti pembayaran." });
    } finally {
      setProofSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={`${styles.card} ${styles.skeletonCard}`}>
          <div className={`${styles.skeletonLineLg} skeleton`} />
          <div className={`${styles.skeletonLine} skeleton`} />
          <div className={`${styles.skeletonLine} skeleton`} />
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.errorText}>{error || "Payment not found."}</p>
          <Link href="/payments" className={styles.link}>Back to payments</Link>
        </div>
      </div>
    );
  }

  const isPending = payment.status.toUpperCase() === "PENDING";
  const isPaid = payment.status.toUpperCase() === "PAID";
  const paymentFlow = getPaymentFlow(payment.status);

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

        <div className={styles.statusFlow}>
          {paymentFlow.map((step) => (
            <div key={step.title} className={styles.statusStep}>
              <span
                className={`${styles.statusDot} ${
                  step.state === "done"
                    ? styles.statusDone
                    : step.state === "active"
                      ? styles.statusActive
                      : step.state === "error"
                        ? styles.statusError
                        : styles.statusTodo
                }`}
              />
              <div>
                <p className={styles.statusTitle}>{step.title}</p>
                <p className={styles.statusHint}>{step.hint}</p>
              </div>
            </div>
          ))}
        </div>

        {isPending && payment.provider === "MANUAL" && (
          <div className={styles.notice}>
            <p className={styles.noticeTitle}><strong>Instruksi pembayaran manual</strong></p>
            <p>{payment.manualInstructions || "Silakan transfer manual dan kirim bukti ke admin."}</p>
            <p className={styles.muted}>
              Estimasi verifikasi: ±{payment.estimatedVerificationMinutes} menit.
              {payment.supportContact ? ` Jika mendesak, hubungi ${payment.supportContact}.` : ""}
            </p>
            {payment.paymentProofUrl ? (
              <div className={styles.proofMeta}>
                <p>
                  <strong>Bukti sudah diupload</strong>
                  {payment.paymentProofSubmittedAt
                    ? ` (${new Date(payment.paymentProofSubmittedAt).toLocaleString("id-ID")})`
                    : ""}
                </p>
                {payment.paymentProofNote ? <p className={styles.muted}>Catatan: {payment.paymentProofNote}</p> : null}
                <a href={payment.paymentProofUrl} target="_blank" rel="noreferrer" className={styles.link}>
                  Lihat bukti pembayaran
                </a>
              </div>
            ) : (
              <p className={styles.muted}>Belum ada bukti pembayaran yang diupload.</p>
            )}
            {payment.paymentProofRejectedAt ? (
              <p className={styles.errorText}>
                Bukti sebelumnya ditolak
                {payment.paymentProofRejectReason ? `: ${payment.paymentProofRejectReason}` : "."}
              </p>
            ) : null}
            <div className={styles.proofUpload}>
              <label className={styles.proofLabel}>Upload bukti pembayaran (JPG/PNG/WEBP/PDF, max 8MB)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className={styles.proofInput}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setProofFile(file);
                  setProofFeedback(null);
                }}
              />
              <textarea
                className={styles.proofTextarea}
                placeholder="Catatan untuk admin (opsional)"
                value={proofNote}
                onChange={(e) => setProofNote(e.target.value)}
              />
              {proofFeedback ? (
                <p className={proofFeedback.type === "error" ? styles.errorText : styles.successText}>{proofFeedback.text}</p>
              ) : null}
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  void uploadProof();
                }}
                disabled={!proofFile || proofSubmitting}
              >
                {proofSubmitting ? "Mengupload..." : "Kirim Bukti Pembayaran"}
              </button>
            </div>
          </div>
        )}

        {isPending && payment.checkoutUrl && (
          <div className={styles.notice}>
            <p className={styles.noticeTitle}><strong>Lanjutkan pembayaran</strong></p>
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

