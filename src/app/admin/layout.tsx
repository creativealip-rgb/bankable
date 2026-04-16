"use client";

import "./admin.css";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/courses", label: "Courses", icon: "🎬" },
  { href: "/admin/members", label: "Members", icon: "👥" },
  { href: "/admin/certificates", label: "Certificates", icon: "🏆" },
  { href: "/admin/payments", label: "Payments", icon: "💳" },
  { href: "/admin/sidebar-content", label: "Sidebar Content", icon: "🧩" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

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
            <span className="gradient-text" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.3rem" }}>
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
              <span className="admin-nav-icon">{item.icon}</span>
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
              <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{session.user.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{session.user.email}</div>
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
