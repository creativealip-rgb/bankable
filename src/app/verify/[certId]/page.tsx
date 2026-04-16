"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import Link from "next/link";

type CertificateData = {
  certificateNumber: string;
  recipientName: string;
  courseName: string;
  score: number;
  issuedAt: string;
};

type PageProps = {
  params: Promise<{ certId: string }>;
};

export default function VerifyCertificatePage({ params }: PageProps) {
  const [certId, setCertId] = useState<string>("");
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    params.then((p) => setCertId(p.certId));
  }, [params]);

  useEffect(() => {
    if (!certId) return;

    async function fetchCertificate() {
      try {
        const res = await fetch(`/api/certificates/verify/${certId}`);
        if (res.ok) {
          const data = await res.json();
          setCert(data);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchCertificate();
  }, [certId]);

  if (loading) {
    return (
      <div className={styles.verifyContainer}>
        <div style={{ color: "var(--text-muted)", padding: "4rem 0" }}>
          Verifying certificate...
        </div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className={styles.verifyContainer}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>❌</div>
          <div className={styles.errorTitle}>Certificate Not Found</div>
          <p className={styles.errorText}>
            The certificate number <strong>{certId}</strong> could not be verified.
            Please double-check the certificate ID and try again.
          </p>
          <Link href="/" className="btn-primary" style={{ display: "inline-block", marginTop: "1.5rem" }}>
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.verifyContainer}>
      <div className={styles.certDisplay}>
        <div className={`${styles.certBrand} gradient-text`}>B A N K A B L E</div>
        <div className={styles.certLabel}>Certificate of Completion</div>

        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>This certifies that</p>
        <div className={styles.certRecipient}>{cert.recipientName}</div>

        <div className={styles.certCourse}>
          has successfully completed the course
          <span className={styles.certCourseName}>&quot;{cert.courseName}&quot;</span>
        </div>

        <div className={styles.certMeta}>
          <div className={styles.certMetaItem}>
            <div className={styles.certMetaLabel}>Score</div>
            <div className={styles.certMetaValue}>{cert.score}%</div>
          </div>
          <div className={styles.certMetaItem}>
            <div className={styles.certMetaLabel}>Date</div>
            <div className={styles.certMetaValue}>
              {new Date(cert.issuedAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        <div className={styles.certId}>{cert.certificateNumber}</div>

        <div>
          <span className={styles.verifiedBadge}>✓ Verified Certificate</span>
        </div>
      </div>
    </div>
  );
}
