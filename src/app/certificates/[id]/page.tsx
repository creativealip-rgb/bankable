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
        <div className={styles.border}>
          <div className={styles.header}>
            <div className={styles.logo}>BELAJARIA</div>
            <div className={styles.title}>SERTIFIKAT KELULUSAN</div>
          </div>

          <div className={styles.content}>
            <p className={styles.present}>Sertifikat ini diberikan kepada:</p>
            <h1 className={styles.userName}>{cert.user.name}</h1>
            <p className={styles.desc}>
              Atas keberhasilannya menyelesaikan kursus online:
            </p>
            <h2 className={styles.courseTitle}>{cert.course.title}</h2>
            <p className={styles.score}>
              Dengan skor akhir: <strong>{parseFloat(cert.score.toString()).toFixed(0)}%</strong>
            </p>
          </div>

          <div className={styles.footer}>
            <div className={styles.signature}>
              <div className={styles.sigLine}></div>
              <p>Direktur BELAJARIA</p>
            </div>
            <div className={styles.meta}>
              <p>ID Sertifikat: {cert.certificateNumber}</p>
              <p>Diterbitkan: {new Date(cert.issuedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.actions}>
        <PrintButton />
      </div>
    </div>
  );
}
