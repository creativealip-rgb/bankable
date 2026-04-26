"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Don't show bottom nav on admin pages or course player
  if (pathname.startsWith("/admin") || pathname.match(/^\/my-courses\/[^/]+$/)) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <nav className="mobile-bottom-nav">
      <Link href="/" className={`bottom-nav-item ${isActive("/") && pathname === "/" ? "active" : ""}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>Beranda</span>
      </Link>

      <Link href="/courses" className={`bottom-nav-item ${isActive("/courses") ? "active" : ""}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span>Katalog</span>
      </Link>

      {session ? (
        <Link href="/my-courses" className={`bottom-nav-item ${isActive("/my-courses") ? "active" : ""}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span>Kursus Saya</span>
        </Link>
      ) : (
        <Link href="/pricing" className={`bottom-nav-item ${isActive("/pricing") ? "active" : ""}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <span>Harga</span>
        </Link>
      )}

      <Link href={session ? "/dashboard" : "/login"} className={`bottom-nav-item ${isActive(session ? "/dashboard" : "/login") ? "active" : ""}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>{session ? "Dashboard" : "Masuk"}</span>
      </Link>
    </nav>
  );
}
