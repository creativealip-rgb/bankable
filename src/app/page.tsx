import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.glowAmbient}></div>
        <div className={styles.heroContent}>
          <h1 className={`${styles.title} animate-float`}>
            Unlock Premium <span className="gradient-text">Digital Assets</span>
          </h1>
          <p className={styles.subtitle}>
            Join the ultimate membership platform giving you unlimited access to 100+ Video Courses, 100+ Ebooks, and 100+ Premium Voice SFX to supercharge your creativity.
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/courses" className="btn-primary">
              Explore Catalog
            </Link>
            <Link href="/pricing" className="btn-secondary">
              View Memberships
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Massive Library of Assets</h2>
        <p className={styles.sectionSubtitle}>Everything you need to level up your skills and creative projects, all in one place.</p>
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>🎬</div>
            <h3 className={styles.cardTitle}>100+ Video Courses</h3>
            <p className={styles.cardDesc}>
              Learn diverse skills ranging from design, programming, business, and video editing through step-by-step sequential courses.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>📚</div>
            <h3 className={styles.cardTitle}>100+ Premium Ebooks</h3>
            <p className={styles.cardDesc}>
              Download highly valuable ebooks across various fields. Read on the go and expand your theoretical knowledge instantly.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>🎵</div>
            <h3 className={styles.cardTitle}>100+ Voice SFX</h3>
            <p className={styles.cardDesc}>
              Elevate your video productions and games with our high-quality, royalty-free Voice SFX repository, perfectly categorised.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.features} style={{ background: "var(--background)", paddingTop: 0 }}>
        <h2 className={styles.sectionTitle}>Course Progression System</h2>
        <div className={styles.grid} style={{ maxWidth: "800px" }}>
          <div className={styles.card}>
             <div className={styles.cardIcon}>🔒</div>
            <h3 className={styles.cardTitle}>Sequential Learning</h3>
            <p className={styles.cardDesc}>
              Courses are structured logically. You must complete a video before unlocking the next module. Take quizzes and earn certificates!
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
