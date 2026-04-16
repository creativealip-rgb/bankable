import Link from "next/link";

type PageProps = { params: Promise<{ slug: string }> };

export default async function QuizResultPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ fontFamily: "var(--font-display)", marginBottom: "0.75rem" }}>Quiz Result</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        Hasil kuis tersimpan di halaman kuis. Route ini disediakan untuk deep-link dan pengembangan result screen terpisah.
      </p>
      <Link href={`/my-courses/${slug}/quiz`} className="btn-primary">
        Back to Quiz
      </Link>
    </div>
  );
}

