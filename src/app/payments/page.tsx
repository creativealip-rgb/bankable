"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type PaymentListItem = {
  id: string;
  tier: string;
  provider: string;
  amount: string;
  status: string;
  externalId: string;
  createdAt: string;
  paidAt: string | null;
  itemType: "LIFETIME" | "PREMIUM_COURSE";
  itemTitle: string;
  itemSlug: string | null;
};

function formatStatus(status: string) {
  const value = status.toUpperCase();
  if (value === "PAID") return "Paid";
  if (value === "PENDING") return "Pending";
  if (value === "FAILED") return "Failed";
  if (value === "EXPIRED") return "Expired";
  return value;
}

function statusIcon(status: string) {
  const value = status.toUpperCase();
  if (value === "PAID") return "✓";
  if (value === "PENDING") return "!";
  if (value === "FAILED" || value === "EXPIRED") return "×";
  return "•";
}

export default function PaymentsPage() {
  const [items, setItems] = useState<PaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/payments")
      .then((res) => res.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Payment Progress</h1>
        <p className={styles.subtitle}>Track pembayaran webinar/course premium kamu di sini.</p>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div className={styles.skeletonList}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`${styles.skeletonCard} skeleton`} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            Belum ada pembayaran.{" "}
            <Link href="/courses" className={styles.link}>
              Lihat course
            </Link>
          </div>
        ) : (
          <>
          <div className={`${styles.tableWrap} ${styles.desktopTable}`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Status</th>
                  <th>Provider</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.itemTitle}</td>
                    <td>
                      <span className={`${styles.status} ${styles[`status${item.status.toUpperCase()}`] || ""}`}>
                        <span className={styles.statusIcon} aria-hidden>{statusIcon(item.status)}</span>
                        {formatStatus(item.status)}
                      </span>
                    </td>
                    <td>{item.provider}</td>
                    <td>Rp {Number(item.amount).toLocaleString("id-ID")}</td>
                    <td>{new Date(item.createdAt).toLocaleDateString("id-ID")}</td>
                    <td>
                      <Link href={`/payments/${item.id}`} className={styles.link}>
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.mobileList}>
            {items.map((item) => (
              <article key={item.id} className={styles.mobileCard}>
                <div className={styles.mobileHead}>
                  <h3 className={styles.mobileTitle}>{item.itemTitle}</h3>
                  <span className={`${styles.status} ${styles[`status${item.status.toUpperCase()}`] || ""}`}>
                    <span className={styles.statusIcon} aria-hidden>{statusIcon(item.status)}</span>
                    {formatStatus(item.status)}
                  </span>
                </div>
                <div className={styles.mobileMeta}>
                  <span>Provider: {item.provider}</span>
                  <span>Rp {Number(item.amount).toLocaleString("id-ID")}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString("id-ID")}</span>
                </div>
                <Link href={`/payments/${item.id}`} className={styles.mobileCta}>
                  Lihat Detail
                </Link>
              </article>
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
}

