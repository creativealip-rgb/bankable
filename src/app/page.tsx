import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.glowAmbient}></div>
        <div className={styles.heroContent}>
          <h1 className={`${styles.title} animate-float`}>
            Semua Aset Premium, <span className="gradient-text">Sekali Bayar</span>
          </h1>
          <p className={styles.subtitle}>
            Cukup Rp29.000 saat daftar untuk akses penuh: 100 ebook, 100 video course, dan 100 voice SFX. Tanpa langganan bulanan.
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/register" className="btn-primary">
              Daftar Sekarang - Rp29.000
            </Link>
            <Link href="/courses" className="btn-secondary">
              Lihat Catalog
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Dapatkan Semua Ini Sekaligus</h2>
        <p className={styles.sectionSubtitle}>Satu harga, satu akun, akses penuh ke semua koleksi Bankable.</p>
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>🎬</div>
            <h3 className={styles.cardTitle}>100 Video Course</h3>
            <p className={styles.cardDesc}>
              Belajar terstruktur dari bisnis, digital skill, sampai produktivitas dengan sistem progress bertahap.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>📚</div>
            <h3 className={styles.cardTitle}>100 Ebook</h3>
            <p className={styles.cardDesc}>
              Koleksi ebook premium siap unduh untuk mempercepat pemahaman dan praktik kamu.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>🎵</div>
            <h3 className={styles.cardTitle}>100 Voice SFX</h3>
            <p className={styles.cardDesc}>
              Siap pakai untuk konten, video, dan kebutuhan editing dengan kualitas premium.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.features} style={{ background: "var(--background)", paddingTop: 0 }}>
        <h2 className={styles.sectionTitle}>Belajar Sampai Tuntas</h2>
        <div className={styles.grid} style={{ maxWidth: "800px" }}>
          <div className={styles.card}>
             <div className={styles.cardIcon}>🔒</div>
            <h3 className={styles.cardTitle}>Progression Learning</h3>
            <p className={styles.cardDesc}>
              Video berikutnya terbuka setelah video sebelumnya selesai. Kerjakan quiz dan raih sertifikat digital.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
