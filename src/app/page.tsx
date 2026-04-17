import styles from "./page.module.css";
import Link from "next/link";

const coreBenefits = [
  {
    title: "One-Time Access, Tanpa Langganan",
    description: "Cukup sekali bayar saat daftar. Tidak ada biaya bulanan yang bikin belajar berhenti di tengah jalan.",
  },
  {
    title: "Belajar Terstruktur Sampai Selesai",
    description: "Sistem progress, quiz, dan sertifikat bantu kamu konsisten sampai benar-benar paham dan bisa praktik.",
  },
  {
    title: "Konten Siap Pakai untuk Hasil Nyata",
    description: "Bukan teori kosong. Materi dirancang untuk langsung dipakai di kerjaan, bisnis, atau portofolio kamu.",
  },
];

const assetPillars = [
  {
    icon: "🎬",
    title: "100 Video Course",
    description: "Materi step-by-step dari bisnis, produktivitas, sampai skill digital dengan alur belajar yang jelas.",
  },
  {
    icon: "📚",
    title: "100 Ebook Premium",
    description: "Ringkasan praktis, framework, dan workbook yang bisa langsung kamu pakai untuk eksekusi.",
  },
  {
    icon: "🎵",
    title: "100 Voice SFX",
    description: "Aset audio siap pakai untuk konten, branding, dan editing agar hasil produksi lebih profesional.",
  },
];

const learningFlow = [
  {
    step: "01",
    title: "Daftar & aktifkan akun",
    description: "Mulai dengan biaya sekali bayar Rp29.000, lalu akses dashboard belajar kamu langsung aktif.",
  },
  {
    step: "02",
    title: "Pilih jalur belajar",
    description: "Temukan course sesuai level dan kebutuhan: mulai dari dasar sampai materi yang lebih advanced.",
  },
  {
    step: "03",
    title: "Belajar + track progress",
    description: "Lanjutkan materi secara terstruktur, pantau progress, dan fokus ke hasil belajar yang terukur.",
  },
  {
    step: "04",
    title: "Kerjakan quiz & raih sertifikat",
    description: "Uji pemahaman lewat quiz dan dapatkan sertifikat digital sebagai bukti kompetensi.",
  },
];

const faqs = [
  {
    question: "Apakah benar hanya sekali bayar?",
    answer:
      "Ya. Untuk paket utama, kamu cukup bayar sekali saat daftar. Tidak ada tagihan bulanan untuk akses katalog utama.",
  },
  {
    question: "Apakah semua konten langsung terbuka?",
    answer:
      "Akses katalog utama langsung tersedia setelah akun aktif. Beberapa konten premium tertentu bisa dijual terpisah.",
  },
  {
    question: "Kalau saya pemula, cocok?",
    answer:
      "Cocok. Materi dirancang bertahap dari fundamental sampai lanjutan, dengan penjelasan yang mudah diikuti.",
  },
  {
    question: "Apakah ada sertifikat?",
    answer:
      "Ada. Untuk course yang memiliki quiz, sertifikat digital bisa didapatkan setelah memenuhi syarat kelulusan.",
  },
];

export default function Home() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.glowAmbient}></div>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Platform belajar + aset digital untuk growth karier & bisnis</span>
          <h1 className={styles.title}>
            Cuma <span className={styles.priceHighlight}>Rp29rb</span>, langsung dapat 300 aset utama.
          </h1>
          <p className={styles.subtitle}>
            Termasuk 100 video course, 100 ebook premium, dan 100 voice SFX untuk bantu kamu belajar dan eksekusi
            lebih cepat tanpa langganan bulanan.
          </p>
          <div className={styles.heroMeta}>
            <span>✅ 300 aset total: 100 video + 100 ebook + 100 voice</span>
            <span>✅ Progress tracking + quiz</span>
            <span>✅ Sertifikat digital</span>
          </div>
          <div className={styles.ctaRow}>
            <Link href="/register" className="btn-primary">
              Mulai Sekarang
            </Link>
            <Link href="/courses" className="btn-secondary">
              Lihat Katalog
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.trustStrip}>
        <div className={styles.container}>
          <div className={styles.trustGrid}>
            <div className={styles.trustItem}>
              <strong>300+</strong>
              <span>Total aset utama</span>
            </div>
            <div className={styles.trustItem}>
              <strong>100%</strong>
              <span>One-time access untuk katalog utama</span>
            </div>
            <div className={styles.trustItem}>
              <strong>24/7</strong>
              <span>Akses belajar dari mana saja</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Kenapa Bankable?</h2>
            <p className={styles.sectionSubtitle}>
              Karena kamu butuh platform yang tidak cuma kasih materi, tapi bantu kamu sampai bisa menghasilkan output.
            </p>
          </div>
          <div className={styles.grid3}>
            {coreBenefits.map((item) => (
              <article key={item.title} className={styles.card}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardDesc}>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionMuted}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Semua yang kamu dapat dalam 1 akun</h2>
            <p className={styles.sectionSubtitle}>Satu harga, satu dashboard, satu alur belajar yang konsisten.</p>
          </div>
          <div className={styles.grid3}>
            {assetPillars.map((item) => (
              <article key={item.title} className={styles.card}>
                <div className={styles.cardIcon}>{item.icon}</div>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardDesc}>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Alur belajar yang jelas, bukan asal nonton</h2>
            <p className={styles.sectionSubtitle}>
              Setiap langkah didesain biar kamu tidak bingung mulai dari mana dan tetap konsisten sampai selesai.
            </p>
          </div>
          <div className={styles.flowGrid}>
            {learningFlow.map((item) => (
              <article key={item.step} className={styles.flowCard}>
                <span className={styles.step}>{item.step}</span>
                <h3 className={styles.flowTitle}>{item.title}</h3>
                <p className={styles.flowDesc}>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionMuted}>
        <div className={styles.containerNarrow}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>FAQ</h2>
            <p className={styles.sectionSubtitle}>Pertanyaan yang paling sering ditanyakan sebelum gabung.</p>
          </div>
          <div className={styles.faqList}>
            {faqs.map((faq) => (
              <details key={faq.question} className={styles.faqItem}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div className={styles.containerNarrow}>
          <h2 className={styles.finalTitle}>Siap naik level tanpa ribet langganan?</h2>
          <p className={styles.finalSubtitle}>
            Mulai dari sekarang, bangun skill dan aset digitalmu di satu tempat yang terstruktur.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/register" className="btn-primary">
              Daftar & Aktifkan Akses
            </Link>
            <Link href="/pricing" className="btn-secondary">
              Lihat Detail Pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
