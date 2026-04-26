"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";

type CertificateData = {
  certificateNumber: string;
  recipientName: string;
  courseName: string;
  score: number;
  issuedAt: string;
  verifyPath: string;
  pdfPath: string;
};

type PageProps = {
  params: Promise<{ certId: string }>;
};

export default function VerifyCertificatePage({ params }: PageProps) {
  const [certId, setCertId] = useState<string>("");
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

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

  useEffect(() => {
    if (!cert) return;
    const verifyUrl = `${window.location.origin}${cert.verifyPath}`;
    QRCode.toDataURL(verifyUrl, { margin: 1, width: 180 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [cert]);

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
      <div className={styles.certificate}>
        <div className={styles.outerBorder}>
          <div className={styles.innerBorder}>
            <div className={styles.watermark}>BELAJARIA</div>
            
            <div className={styles.header}>
              <div className={styles.logo}>BELAJARIA</div>
              <div className={styles.title}>Verification of Completion</div>
            </div>

            <div className={styles.content}>
              <p className={styles.present}>This is to certify that the record for</p>
              <h1 className={styles.userName}>{cert.recipientName}</h1>
              <p className={styles.desc}>
                is a verified completion of the professional course:
              </p>
              <h2 className={styles.courseTitle}>{cert.courseName}</h2>
              <div className={styles.scoreRow}>
                <span>Final Score: <strong>{cert.score}%</strong></span>
                <span className={styles.separator}>•</span>
                <span>Date: <strong>{new Date(cert.issuedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong></span>
              </div>
            </div>

            <div className={styles.footer}>
              <div className={styles.seal}>
                <div className={styles.sealCircle}>
                  <span>VERIFIED</span>
                  <span>RECORD</span>
                </div>
              </div>
              
              <div className={styles.meta}>
                <p>Certificate ID: {cert.certificateNumber}</p>
                <div className={styles.verifiedBadge}>✓ Authentic Certificate</div>
              </div>
            </div>

            {qrDataUrl && (
              <div className={styles.qrSection}>
                <Image src={qrDataUrl} alt="Certificate QR verification" width={100} height={100} className={styles.qrImage} />
                <div className={styles.downloadSection}>
                  <a href={cert.pdfPath} className="btn-primary" style={{ textDecoration: "none", fontSize: "0.85rem", padding: "8px 20px" }}>
                    Download Official PDF
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
