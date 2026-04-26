import { db } from "@/db";
import { certificates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import styles from "./page.module.css";

type Params = { params: Promise<{ id: string }> };

import PrintButton from "./PrintButton";

export default async function CertificatePage({ params }: Params) {
  const { id } = await params;

  const cert = await db.query.certificates.findFirst({
    where: eq(certificates.id, id),
    with: {
      user: { columns: { name: true } },
      course: { columns: { title: true } },
    },
  });

  if (!cert) notFound();

  return (
    <div className={styles.container}>
      <div className={styles.certificate}>
        <div className={styles.outerBorder}>
          <div className={styles.innerBorder}>
            <div className={styles.watermark}>BELAJARIA</div>
            
            <div className={styles.header}>
              <div className={styles.logo}>BELAJARIA</div>
              <div className={styles.title}>Certificate of Completion</div>
            </div>

            <div className={styles.content}>
              <p className={styles.present}>This is to certify that</p>
              <h1 className={styles.userName}>{cert.user.name}</h1>
              <p className={styles.desc}>
                has successfully completed the professional online course:
              </p>
              <h2 className={styles.courseTitle}>{cert.course.title}</h2>
              <div className={styles.scoreRow}>
                <span>Final Score: <strong>{parseFloat(cert.score.toString()).toFixed(0)}%</strong></span>
                <span className={styles.separator}>•</span>
                <span>Date: <strong>{new Date(cert.issuedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong></span>
              </div>
            </div>

            <div className={styles.footer}>
              <div className={styles.seal}>
                <div className={styles.sealCircle}>
                  <span>OFFICIAL</span>
                  <span>SEAL</span>
                </div>
              </div>
              
              <div className={styles.signature}>
                <div className={styles.sigContainer}>
                  <div className={styles.sigName}>Dimas Febriansyah</div>
                  <div className={styles.sigLine}></div>
                  <p className={styles.sigTitle}>Founder & Director</p>
                </div>
              </div>

              <div className={styles.meta}>
                <div className={styles.qrCode}>
                  <div className={styles.qrPattern}></div>
                  <span>VERIFIED</span>
                </div>
                <div className={styles.metaText}>
                  <p>Certificate ID: {cert.certificateNumber}</p>
                  <p>Verify at: belajaria.id/verify</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.actions}>
        <PrintButton />
        <button 
          className={styles.linkedinBtn}
          onClick={() => {
            const url = encodeURIComponent(window.location.href);
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
          }}
        >
          <span>in</span> Bagikan ke LinkedIn
        </button>
      </div>
    </div>
  );
}
