"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { NavAuth } from "./nav-auth";
import { ThemeToggle } from "./theme-toggle";
import { SearchModal } from "@/components/SearchModal";
import { NotificationBell } from "@/components/NotificationBell";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MainNav() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSearchClick = (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    setSearchModalOpen(true);
  };

  const links = useMemo<NavItem[]>(() => {
    const publicLinks: NavItem[] = [
      { 
        href: "/courses", 
        label: "Katalog", 
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
      }, 
      { 
        href: "/pricing", 
        label: "Harga", 
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>
      }
    ];

    if (!session) return publicLinks;

    return [
      { 
        href: "/courses", 
        label: "Katalog", 
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
      },
      { 
        href: "/my-courses", 
        label: "Kursus Saya", 
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" /><path d="M10 12l-3 1.5v-3L10 12z" /></svg>
      },
      { 
        href: "/payments", 
        label: "Pembayaran", 
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
      },
      { 
        href: "/dashboard", 
        label: "Dashboard", 
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
      },
    ];
  }, [session]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!mobileMenuOpen) return;
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setSearchModalOpen(true);
      }
      if (event.key === "Escape") setMobileMenuOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = (mobileMenuOpen || searchModalOpen) ? "hidden" : "";
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen, searchModalOpen]);

  return (
    <nav className="main-nav">
      <div className="nav-container" ref={navRef}>
        <div className="logo">
          <Link href="/" className="brand-link" onClick={() => setMobileMenuOpen(false)}>
            <span className="gradient-text brand-wordmark">BELAJARIA</span>
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {session && <NotificationBell />}
          <ThemeToggle />
          <form className="nav-global-search" onSubmit={handleSearchClick}>
            <div className="nav-search-wrapper" onClick={handleSearchClick}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-search-icon">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Cari... (Ctrl+K)"
                readOnly
                className="nav-search-input"
              />
            </div>
          </form>
          <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
        </div>

        <div className="nav-right">
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="main-nav-links"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className={`nav-links${mobileMenuOpen ? " nav-links-open" : ""}`}>
            <div className="nav-drawer-head">
              <span className="nav-drawer-title">Menu</span>
              <button
                type="button"
                className="nav-drawer-close"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
              >
                ×
              </button>
            </div>
            <div id="main-nav-links" className="nav-primary-links">
              {isPending ? (
                <span className="nav-loading">...</span>
              ) : (
                links.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`nav-drawer-link ${isActivePath(pathname, item.href) ? "nav-link-active" : ""}`}
                    aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                  >
                    <span className="nav-link-icon-box">{item.icon}</span>
                    <span className="nav-link-text">{item.label}</span>
                  </Link>
                ))
              )}
            </div>
            <NavAuth onNavigate={() => setMobileMenuOpen(false)} drawerMode={mobileMenuOpen} />
          </div>
        </div>
      </div>
      <button
        type="button"
        className={`nav-drawer-backdrop${mobileMenuOpen ? " nav-drawer-backdrop-open" : ""}`}
        aria-label="Close navigation menu"
        onClick={() => setMobileMenuOpen(false)}
      />
    </nav>
  );
}

