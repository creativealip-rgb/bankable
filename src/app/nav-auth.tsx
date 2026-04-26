"use client";

import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

type NavAuthProps = {
  onNavigate?: () => void;
  drawerMode?: boolean;
};

export function NavAuth({ onNavigate, drawerMode = false }: NavAuthProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = "nav-user-menu";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  if (isPending) {
    return <span className="nav-loading">...</span>;
  }

  if (session) {
    const role = (session.user as Record<string, unknown>).role as string;
    const initial = session.user.name?.charAt(0)?.toUpperCase() || "?";
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

    if (drawerMode) {
      return (
        <div className="nav-drawer-account">
          <div className="nav-drawer-section-label">Akun</div>
          <div className="nav-drawer-account-header">
            <span className="nav-user-initial">{initial}</span>
            <div className="nav-drawer-account-meta">
              <div className="nav-user-meta-name">{session.user.name}</div>
              <div className="nav-user-meta-email">{session.user.email}</div>
            </div>
          </div>

          <div className="nav-drawer-account-links">
            <Link href="/profile" onClick={() => onNavigate?.()} className="nav-user-menu-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              Profil
            </Link>
            <Link href="/certificates" onClick={() => onNavigate?.()} className="nav-user-menu-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
              Sertifikat
            </Link>
            {isAdmin && (
              <Link href="/admin" onClick={() => onNavigate?.()} className="nav-user-menu-link nav-user-menu-link-admin">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                Admin Panel
              </Link>
            )}
            <div className="nav-user-divider"></div>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                onNavigate?.();
                router.push("/");
                router.refresh();
              }}
              className="nav-user-logout-drawer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              Keluar
            </button>
          </div>
        </div>
      );
    }

    return (
      <div ref={menuRef} className="nav-auth">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="nav-user-toggle"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={menuId}
        >
          <span className="nav-user-initial">{initial}</span>
          <span className="nav-user-name">{session.user.name}</span>
          <span className="nav-caret" aria-hidden="true">▾</span>
        </button>

        {menuOpen && (
          <div id={menuId} className="nav-user-menu" role="menu">
            <div className="nav-user-meta">
              <div className="nav-user-meta-name">{session.user.name}</div>
              <div className="nav-user-meta-email">{session.user.email}</div>
            </div>

            {[
              { href: "/profile", label: "Profil" },
              { href: "/certificates", label: "Sertifikat" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setMenuOpen(false);
                  onNavigate?.();
                }}
                className="nav-user-menu-link"
                role="menuitem"
              >
                {item.label}
              </Link>
            ))}

            {isAdmin && (
              <>
                <div className="nav-user-divider"></div>
                <Link
                  href="/admin"
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigate?.();
                  }}
                  className="nav-user-menu-link nav-user-menu-link-admin"
                  role="menuitem"
                >
                  Admin Panel
                </Link>
              </>
            )}

            <div className="nav-user-divider"></div>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                setMenuOpen(false);
                onNavigate?.();
                router.push("/");
                router.refresh();
              }}
              className="nav-user-logout"
              role="menuitem"
            >
              Keluar
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="nav-auth-guest">
      <Link href="/login" onClick={() => onNavigate?.()} className="nav-login-link">Masuk</Link>
      <Link href="/register" onClick={() => onNavigate?.()} className="btn-primary nav-join-link">Daftar</Link>
    </div>
  );
}
