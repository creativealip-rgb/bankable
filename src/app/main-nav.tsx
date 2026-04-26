"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { NavAuth } from "./nav-auth";
import { ThemeToggle } from "./theme-toggle";

type NavItem = {
  href: string;
  label: string;
};

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MainNav() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/courses?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue("");
      setMobileMenuOpen(false);
    }
  };

  const links = useMemo<NavItem[]>(() => {
    const publicLinks: NavItem[] = [{ href: "/courses", label: "Katalog" }, { href: "/pricing", label: "Harga" }];

    if (!session) return publicLinks;

    return [
      { href: "/courses", label: "Katalog" },
      { href: "/my-courses", label: "Kursus Saya" },
      { href: "/payments", label: "Pembayaran" },
      { href: "/dashboard", label: "Dashboard" },
    ];
  }, [session]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!mobileMenuOpen) return;
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileMenuOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <nav className="main-nav">
      <div className="nav-container" ref={navRef}>
        <div className="logo">
          <Link href="/" className="brand-link" onClick={() => setMobileMenuOpen(false)}>
            <span className="gradient-text brand-wordmark">BELAJARIA</span>
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ThemeToggle />
          <form className="nav-global-search" onSubmit={handleSearch}>
            <div className="nav-search-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-search-icon">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Cari kursus..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="nav-search-input"
              />
            </div>
          </form>
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
                    className={isActivePath(pathname, item.href) ? "nav-link-active" : undefined}
                    aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                  >
                    {item.label}
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

