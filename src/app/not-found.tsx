import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ padding: "4rem 1rem", textAlign: "center" }}>
      <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "0.75rem" }}>Page not found</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem" }}>
        The page you requested does not exist.
      </p>
      <Link href="/" className="btn-primary">
        Return home
      </Link>
    </div>
  );
}
