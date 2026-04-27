"use client";

import "./admin.css";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/courses", label: "Kursus", icon: "courses" },
  { href: "/admin/members", label: "Member", icon: "members" },
  { href: "/admin/certificates", label: "Sertifikat", icon: "certificates" },
  { href: "/admin/payments", label: "Pembayaran", icon: "payments" },
  { href: "/admin/sidebar-content", label: "Konten Sidebar", icon: "sidebar" },
  { href: "/admin/audit-logs", label: "Log Audit", icon: "audit" },
  { href: "/admin/settings", label: "Pengaturan", icon: "settings" },
];

type NavIconKey = (typeof NAV_ITEMS)[number]["icon"];

function NavIcon({ name }: { name: NavIconKey }) {
  if (name === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 4h7v7H4V4Zm9 0h7v4h-7V4ZM13 10h7v10h-7V10ZM4 13h7v7H4v-7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "courses") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v11.5a1.5 1.5 0 0 1-2.4 1.2L12 15.5l-5.1 3.7a1.5 1.5 0 0 1-2.4-1.2V6.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M8 9h8M8 12h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "members") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M9 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" strokeWidth="1.7" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0M14.5 19a4 4 0 0 1 6 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "certificates") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6.5 4.5h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4l-1.5 2-1.5-2h-4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M8.5 9h7M8.5 12h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "payments") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M3.5 10h17M8 15h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "sidebar") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.7" />
        <path d="M9 4v16M12 9h5M12 12h5M12 15h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "audit") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.7" />
        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.7" />
        <path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 8.5V4m0 16v-4.5M8.5 12H4m16 0h-4.5m-6.4-6.4L6.9 7.8m10.2 0 1.9-1.9m-12.1 12.2 1.9-1.9m8.3 1.9-1.9-1.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const role = (session?.user as Record<string, unknown> | undefined)?.role as string | undefined;
  const hasAdminAccess = role === "ADMIN" || role === "SUPER_ADMIN";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isPending && (!session || !hasAdminAccess)) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/admin")}`);
    }
  }, [session, isPending, router, hasAdminAccess, pathname]);

  if (isPending) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>Memuat panel admin...</p>
      </div>
    );
  }

  if (!session || !hasAdminAccess) {
    return null;
  }

  return (
    <div className={`admin-layout ${isSidebarOpen ? "sidebar-open" : ""}`}>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="admin-sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${isSidebarOpen ? "active" : ""}`}>
        <div className="admin-sidebar-header">
          <Link href="/" onClick={() => setIsSidebarOpen(false)}>
            <span className="gradient-text admin-brand">
              BELAJARIA
            </span>
          </Link>
          <button 
            className="admin-sidebar-close-btn"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close Navigation"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-label">Menu Utama</div>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className={`admin-nav-item ${
                item.href === "/admin"
                  ? pathname === "/admin" ? "active" : ""
                  : pathname.startsWith(item.href) ? "active" : ""
              }`}
            >
              <span className="admin-nav-icon">
                <NavIcon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-profile">
            <div className="admin-user-avatar">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="admin-user-details">
              <div className="admin-user-name">{session.user.name}</div>
              <div className="admin-user-role">Administrator</div>
            </div>
          </div>
          <Link href="/" className="admin-back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Kembali ke Situs
          </Link>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-content-header">
          <div className="admin-header-left">
            <Link href="/" className="admin-mobile-logo">
              <span className="gradient-text">BELAJARIA</span>
            </Link>
            <div className="admin-header-title">
              <h1>Panel Kontrol</h1>
              <p>Kelola konten platform</p>
            </div>
          </div>
          
          <button 
            className="admin-hamburger-btn"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open Navigation"
          >
            <span />
            <span />
            <span />
          </button>
        </header>
        <div className="admin-page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
