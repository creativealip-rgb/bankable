"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  // Don't show footer on admin pages, course player, or catalog pages (which have fixed sidebars)
  if (pathname.startsWith("/admin") || pathname.match(/^\/my-courses\/[^/]+$/) || pathname.startsWith("/courses")) {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              <span className="gradient-text footer-logo-text">BELAJARIA</span>
            </Link>
            <p className="footer-tagline">
              Platform belajar + aset digital untuk growth karier &amp; bisnis. Sekali bayar, akses selamanya.
            </p>
          </div>

          {/* Navigation */}
          <div className="footer-col">
            <h4 className="footer-col-title">Navigasi</h4>
            <ul className="footer-links">
              <li><Link href="/">Beranda</Link></li>
              <li><Link href="/courses">Katalog</Link></li>
              <li><Link href="/pricing">Harga</Link></li>
              <li><Link href="/register">Daftar</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-col">
            <h4 className="footer-col-title">Member</h4>
            <ul className="footer-links">
              <li><Link href="/dashboard">Dashboard</Link></li>
              <li><Link href="/my-courses">Kursus Saya</Link></li>
              <li><Link href="/certificates">Sertifikat</Link></li>
              <li><Link href="/profile">Profil</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4 className="footer-col-title">Bantuan</h4>
            <ul className="footer-links">
              <li><Link href="/pricing#faq">FAQ</Link></li>
              <li><a href="mailto:support@belajaria.com">Email Support</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} BELAJARIA. Hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
