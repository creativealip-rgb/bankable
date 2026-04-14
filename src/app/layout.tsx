import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bankable | Premium Digital Assets",
  description: "Access 100+ Ebooks, 100+ Video Courses, and 100+ Voice SFX inside our premium membership.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav className="glass-panel main-nav">
          <div className="nav-container">
            <div className="logo">
              <span className="gradient-text" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem' }}>Bankable</span>
            </div>
            <div className="nav-links">
              <Link href="/courses">Courses</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/login" style={{ color: 'var(--text-muted)' }}>Login</Link>
              <Link href="/register" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Join Now</Link>
            </div>
          </div>
        </nav>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
