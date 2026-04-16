"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import Link from "next/link";

type Certificate = {
  id: string;
  certificateNumber: string;
  score: string;
  issuedAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
  };
};

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCerts() {
      setError("");
      try {
        const res = await fetch("/api/certificates");
        if (res.ok) {
          const data = await res.json();
          setCertificates(data);
        } else {
          const data = await res.json();
          setError(data.error || "Failed to load certificates.");
        }
      } catch (fetchError) {
        console.error("Failed to fetch certificates:", fetchError);
        setError("Failed to load certificates.");
      } finally {
        setLoading(false);
      }
    }
    fetchCerts();
  }, []);

  if (loading) {
    return (
      <div className={styles.certsContainer}>
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
          Loading certificates...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.certsContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Certificates</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Your earned certificates from completed courses. Share them with pride!
        </p>
        {error && <p style={{ color: "var(--danger)", marginTop: "0.5rem" }}>{error}</p>}
      </div>

      <div className={styles.certGrid}>
        {certificates.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏆</div>
            <div className={styles.emptyText}>
              No certificates yet. Complete a course and pass the quiz to earn your first one!
            </div>
            <Link href="/courses" className="btn-primary">
              Browse Courses
            </Link>
          </div>
        ) : (
          certificates.map((cert) => (
            <div key={cert.id} className={styles.certCard}>
              <div className={styles.certHeader}>
                <span className={styles.certIcon}>🏆</span>
                <div>
                  <div className={styles.certCourse}>{cert.course.title}</div>
                  <div className={styles.certNumber}>{cert.certificateNumber}</div>
                </div>
              </div>

              <div className={styles.certBody}>
                <div className={styles.certDetail}>
                  <span className={styles.certDetailLabel}>Score</span>
                  <span className={styles.certDetailValue}>
                    {parseFloat(cert.score).toFixed(0)}%
                  </span>
                </div>
                <div className={styles.certDetail}>
                  <span className={styles.certDetailLabel}>Issued Date</span>
                  <span className={styles.certDetailValue}>
                    {new Date(cert.issuedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className={styles.certDetail}>
                  <span className={styles.certDetailLabel}>Status</span>
                  <span className={styles.certDetailValue} style={{ color: "var(--success)" }}>
                    ✓ Verified
                  </span>
                </div>
              </div>

              <div className={styles.certActions}>
                <Link
                  href={`/verify/${cert.certificateNumber}`}
                  className={`${styles.certBtn} ${styles.certBtnOutline}`}
                >
                  View Certificate
                </Link>
                <button
                  className={`${styles.certBtn} ${styles.certBtnPrimary}`}
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/verify/${cert.certificateNumber}`
                    );
                    alert("Verification link copied to clipboard!");
                  }}
                >
                  Share Link
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
