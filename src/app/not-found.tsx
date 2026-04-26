import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ padding: "4rem 1rem", textAlign: "center" }}>
      <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "0.75rem" }}>Halaman tidak ditemukan</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem" }}>
        Halaman yang kamu cari tidak tersedia.
      </p>
      <Link href="/" className="btn-primary">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
