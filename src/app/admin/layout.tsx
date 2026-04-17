"use client";

import "./admin.css";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/courses", label: "Courses", icon: "courses" },
  { href: "/admin/members", label: "Members", icon: "members" },
  { href: "/admin/certificates", label: "Certificates", icon: "certificates" },
  { href: "/admin/payments", label: "Payments", icon: "payments" },
  { href: "/admin/sidebar-content", label: "Sidebar Content", icon: "sidebar" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
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

  useEffect(() => {
    if (!isPending && (!session || !hasAdminAccess)) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/admin")}`);
    }
  }, [session, isPending, router, hasAdminAccess, pathname]);

  if (isPending) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>Loading admin panel...</p>
      </div>
    );
  }

  if (!session || !hasAdminAccess) {
    return null;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link href="/">
            <span className="gradient-text admin-brand">
              Bankable
            </span>
          </Link>
          <span className="admin-badge">Admin</span>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
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
          <div className="admin-user-info">
            <div className="admin-user-avatar">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="admin-user-meta-name">{session.user.name}</div>
              <div className="admin-user-meta-email">{session.user.email}</div>
            </div>
          </div>
          <Link href="/" className="admin-back-link">
            ← Back to site
          </Link>
        </div>
      </aside>

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
