import styles from "./page.module.css";
import Link from "next/link";

const socialProof = [
  { number: "300+", label: "Aset Digital Siap Pakai" },
  { number: "Rp29rb", label: "Sekali Bayar, Akses Selamanya" },
  { number: "24/7", label: "Belajar Kapan Saja" },
];

const painPoints = [
  {
    emoji: "😤",
    pain: "Langganan bulanan terus-terusan",
    solve: "Bayar sekali. Titik. Tanpa biaya tersembunyi, tanpa auto-debit yang bikin kaget.",
  },
  {
    emoji: "😵",
    pain: "Bingung mulai dari mana",
    solve: "Jalur belajar terstruktur dari nol sampai mahir. Tinggal ikuti step-by-step.",
  },
  {
    emoji: "😩",
    pain: "Belajar tapi nggak ada buktinya",
    solve: "Selesaikan kursus, kerjakan quiz, dan dapatkan sertifikat digital yang bisa kamu pamerkan.",
  },
];

const assetPillars = [
  {
    icon: "🎬",
    count: "100+",
    title: "Video Course",
    description: "Dari bisnis, programming, design, sampai personal growth — semua dibuat step-by-step supaya mudah diikuti.",
    gradient: "linear-gradient(135deg, #4f46e5, #6366f1)",
  },
  {
    icon: "📚",
    count: "100+",
    title: "Ebook Premium",
    description: "Framework, workbook, dan ringkasan praktis yang bisa langsung kamu pakai untuk eksekusi hari ini.",
    gradient: "linear-gradient(135deg, #10b981, #34d399)",
  },
  {
    icon: "🎵",
    count: "100+",
    title: "Voice & SFX",
    description: "Aset audio siap pakai untuk konten kreator, podcast, dan editing video yang lebih profesional.",
    gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
  },
];

const learningFlow = [
  {
    step: "01",
    title: "Daftar & bayar sekali",
    description: "Cukup Rp29.000 — lalu dashboard belajarmu langsung aktif. Tidak ada trial, tidak ada jebakan.",
    icon: "⚡",
  },
  {
    step: "02",
    title: "Pilih jalur belajarmu",
    description: "Eksplorasi 300+ aset: video, ebook, dan audio. Filter berdasarkan level, kategori, atau format.",
    icon: "🧭",
  },
  {
    step: "03",
    title: "Belajar & track progress",
    description: "Sistem melacak setiap video yang kamu tonton. Lanjutkan kapan saja tanpa kehilangan progress.",
    icon: "📊",
  },
  {
    step: "04",
    title: "Raih sertifikat",
    description: "Kerjakan quiz akhir dan dapatkan sertifikat digital sebagai bukti kompetensi kamu.",
    icon: "🏆",
  },
];

const testimonials = [
  {
    name: "Rina A.",
    role: "Freelancer",
    text: "Ini platform pertama yang bikin aku selesaikan kursus sampai habis. Sistemnya terstruktur banget!",
    avatar: "R",
  },
  {
    name: "Dimas P.",
    role: "Content Creator",
    text: "Voice SFX dan video coursenya keren banget. Sekali bayar langsung dapat semuanya, worth it parah.",
    avatar: "D",
  },
  {
    name: "Sari W.",
    role: "Mahasiswa",
    text: "Rp29rb buat akses 300 aset? Ini lebih murah dari satu kali ngopi tapi bermanfaat buat karir.",
    avatar: "S",
  },
];

const faqs = [
  {
    question: "Apakah benar cuma bayar sekali?",
    answer: "100% benar. Kamu bayar Rp29.000 sekali saat daftar, lalu akses katalog utama (100 video + 100 ebook + 100 voice SFX) selamanya. Tidak ada tagihan bulanan.",
  },
  {
    question: "Kalau saya pemula banget, cocok?",
    answer: "Sangat cocok. Materi dirancang bertahap — dari fundamental sampai lanjutan. Kamu bisa filter berdasarkan level (Beginner, Intermediate, Advanced).",
  },
  {
    question: "Apakah ada sertifikat?",
    answer: "Ada! Setiap course yang memiliki quiz bisa menghasilkan sertifikat digital setelah kamu lulus. Sertifikat bisa diunduh dan dibagikan.",
  },
  {
    question: "Apa bedanya dengan platform langganan?",
    answer: "Di platform lain, kamu bayar bulanan dan kehilangan akses kalau berhenti. Di BELAJARIA, sekali bayar = akses selamanya. Lebih hemat, lebih tenang.",
  },
  {
    question: "Bagaimana kalau kontennya nggak cocok?",
    answer: "Kamu bisa eksplorasi katalog yang sangat beragam: bisnis, programming, design, marketing, dan personal growth. Dengan 300+ aset, pasti ada yang cocok.",
  },
];

export default function Home() {
  return (
    <>
      {/* ═══════ HERO ═══════ */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroGlow2} />
        <div className={styles.heroContent}>
          <span className={styles.badge}>
            🔥 Sudah diakses ratusan pelajar di seluruh Indonesia
          </span>
          <h1 className={styles.title}>
            Kuasai Skill Digital.{" "}
            <span className={styles.titleGradient}>Bayar Sekali.</span>{" "}
            Akses Selamanya.
          </h1>
          <p className={styles.subtitle}>
            300+ video course, ebook, dan audio asset dalam satu platform terstruktur.
            Tanpa langganan bulanan. Cuma{" "}
            <strong className={styles.priceInline}>Rp29.000</strong> untuk selamanya.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/register" className={styles.ctaPrimary}>
              Mulai Belajar Sekarang — Rp29rb
              <span className={styles.ctaArrow}>→</span>
            </Link>
            <Link href="/courses" className={styles.ctaSecondary}>
              Lihat Katalog Lengkap
            </Link>
          </div>
          <p className={styles.ctaNote}>
            ✓ Akses langsung setelah bayar &nbsp;·&nbsp; ✓ Tanpa langganan &nbsp;·&nbsp; ✓ Sertifikat digital
          </p>
        </div>
      </section>

      {/* ═══════ SOCIAL PROOF STRIP ═══════ */}
      <section className={styles.proofStrip}>
        <div className={styles.container}>
          <div className={styles.proofGrid}>
            {socialProof.map((item) => (
              <div key={item.label} className={styles.proofItem}>
                <strong>{item.number}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PAIN → SOLUTION ═══════ */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>Masalah Belajar Online</span>
            <h2 className={styles.sectionTitle}>
              Kamu pasti pernah ngalamin ini...
            </h2>
          </div>
          <div className={styles.painGrid}>
            {painPoints.map((item) => (
              <div key={item.pain} className={styles.painCard}>
                <div className={styles.painEmoji}>{item.emoji}</div>
                <div className={styles.painText}>
                  <p className={styles.painProblem}>{item.pain}</p>
                  <p className={styles.painSolution}>
                    <span className={styles.solveBadge}>BELAJARIA:</span> {item.solve}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ WHAT YOU GET ═══════ */}
      <section className={styles.sectionDark}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabelLight}>Semua Dalam 1 Akun</span>
            <h2 className={styles.sectionTitleLight}>
              300+ aset digital yang kamu dapatkan
            </h2>
            <p className={styles.sectionSubLight}>
              Satu harga. Satu dashboard. Satu alur belajar yang konsisten dari nol sampai mahir.
            </p>
          </div>
          <div className={styles.assetGrid}>
            {assetPillars.map((item) => (
              <div key={item.title} className={styles.assetCard}>
                <div className={styles.assetIconWrap} style={{ background: item.gradient }}>
                  <span className={styles.assetIcon}>{item.icon}</span>
                </div>
                <div className={styles.assetCount}>{item.count}</div>
                <h3 className={styles.assetTitle}>{item.title}</h3>
                <p className={styles.assetDesc}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>Cara Kerja</span>
            <h2 className={styles.sectionTitle}>
              4 langkah menuju skill baru
            </h2>
            <p className={styles.sectionSub}>
              Bukan asal nonton. Setiap langkah didesain biar kamu konsisten dan benar-benar paham.
            </p>
          </div>
          <div className={styles.flowGrid}>
            {learningFlow.map((item) => (
              <div key={item.step} className={styles.flowCard}>
                <div className={styles.flowIcon}>{item.icon}</div>
                <span className={styles.flowStep}>Step {item.step}</span>
                <h3 className={styles.flowTitle}>{item.title}</h3>
                <p className={styles.flowDesc}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className={styles.sectionMuted}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>Kata Mereka</span>
            <h2 className={styles.sectionTitle}>
              Pelajar yang sudah merasakan manfaatnya
            </h2>
          </div>
          <div className={styles.testimonialGrid}>
            {testimonials.map((t) => (
              <div key={t.name} className={styles.testimonialCard}>
                <p className={styles.testimonialText}>&ldquo;{t.text}&rdquo;</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.testimonialAvatar}>{t.avatar}</div>
                  <div>
                    <div className={styles.testimonialName}>{t.name}</div>
                    <div className={styles.testimonialRole}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PRICING ANCHOR ═══════ */}
      <section className={styles.pricingSection}>
        <div className={styles.containerNarrow}>
          <div className={styles.pricingCard}>
            <div className={styles.pricingBadge}>PALING POPULER</div>
            <h3 className={styles.pricingTitle}>Akses Selamanya</h3>
            <div className={styles.pricingRow}>
              <span className={styles.pricingStrike}>Rp299.000</span>
              <span className={styles.pricingAmount}>Rp29<span className={styles.pricingSuffix}>.000</span></span>
            </div>
            <p className={styles.pricingSave}>Hemat 90% — Penawaran terbatas!</p>
            <ul className={styles.pricingFeatures}>
              <li>✅ 100+ Video Course terstruktur</li>
              <li>✅ 100+ Ebook & Workbook premium</li>
              <li>✅ 100+ Voice SFX & Audio Asset</li>
              <li>✅ Progress tracking & dashboard</li>
              <li>✅ Quiz interaktif + Sertifikat digital</li>
              <li>✅ Update konten gratis selamanya</li>
            </ul>
            <Link href="/register" className={styles.pricingCta}>
              Daftar Sekarang — Rp29.000
            </Link>
            <p className={styles.pricingNote}>Sekali bayar. Tanpa langganan. Tanpa biaya tersembunyi.</p>
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className={styles.section}>
        <div className={styles.containerNarrow}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>FAQ</span>
            <h2 className={styles.sectionTitle}>Pertanyaan yang Sering Ditanyakan</h2>
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

      {/* ═══════ FINAL CTA ═══════ */}
      <section className={styles.finalCta}>
        <div className={styles.finalGlow} />
        <div className={styles.containerNarrow}>
          <h2 className={styles.finalTitle}>
            Skill baru menunggu.{" "}
            <span className={styles.titleGradient}>Mulai sekarang.</span>
          </h2>
          <p className={styles.finalSubtitle}>
            Bergabung dengan ratusan pelajar lain yang sudah memulai perjalanan mereka.
            Investasi Rp29.000 hari ini, manfaat seumur hidup.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/register" className={styles.ctaPrimary}>
              Daftar & Aktifkan Akses
              <span className={styles.ctaArrow}>→</span>
            </Link>
            <Link href="/pricing" className={styles.ctaSecondary}>
              Lihat Detail Harga
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
