import Link from "next/link";
import styles from "./page.module.css";

const includedItems = [
  {
    icon: "🎬",
    title: "100 Video Course",
    text: "Materi step-by-step untuk bisnis, skill digital, dan produktivitas.",
  },
  {
    icon: "📚",
    title: "100 Ebook Premium",
    text: "Template, framework, dan panduan praktis yang bisa langsung dipakai.",
  },
  {
    icon: "🎧",
    title: "100 Voice / SFX",
    text: "Aset audio siap pakai untuk konten, branding, dan editing.",
  },
];

const memberBenefits = [
  "Sekali bayar Rp29.000 (bukan langganan bulanan).",
  "Akses member area + katalog utama dalam satu dashboard.",
  "Progress tracker, quiz, dan sertifikat digital.",
  "Belajar terstruktur, bukan sekadar kumpulan file.",
];

const faqs = [
  {
    q: "Apakah benar hanya bayar sekali?",
    a: "Iya, paket member utama cukup sekali bayar Rp29.000.",
  },
  {
    q: "Setelah bayar, apa langsung bisa belajar?",
    a: "Ya, akses member aktif dan kamu bisa langsung masuk ke katalog utama.",
  },
  {
    q: "Apakah ada sertifikat?",
    a: "Ada, untuk course yang memiliki quiz dan memenuhi syarat kelulusan.",
  },
];

export default function PricingPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.badge}>Akses Member Bankable</span>
        <h1 className={styles.title}>Cukup Rp29.000 untuk mulai belajar dengan alur yang jelas</h1>
        <p className={styles.subtitle}>
          Halaman ini khusus menjelaskan benefit member. Fokusnya: kamu langsung tahu apa yang didapat setelah aktivasi.
        </p>

        <div className={styles.memberCard}>
          <p className={styles.price}>Rp29.000</p>
          <p className={styles.priceLabel}>Sekali bayar • akses member utama</p>
          <div className={styles.ctaRow}>
            <Link href="/register" className={styles.primaryBtn}>
              Daftar & Aktifkan Akses
            </Link>
            <Link href="/" className={styles.secondaryBtn}>
              Kembali ke Landing
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Yang kamu dapat</h2>
        <div className={styles.includedGrid}>
          {includedItems.map((item) => (
            <article key={item.title} className={styles.includedCard}>
              <span className={styles.includedIcon}>{item.icon}</span>
              <h3 className={styles.includedTitle}>{item.title}</h3>
              <p className={styles.includedText}>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Benefit member</h2>
        <ul className={styles.benefitList}>
          {memberBenefits.map((item) => (
            <li key={item} className={styles.benefitItem}>
              ✅ {item}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Pertanyaan umum</h2>
        <div className={styles.faqList}>
          {faqs.map((item) => (
            <details key={item.q} className={styles.faqItem}>
              <summary className={styles.faqQuestion}>{item.q}</summary>
              <p className={styles.faqAnswer}>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

