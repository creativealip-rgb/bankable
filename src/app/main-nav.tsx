"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { NavAuth } from "./nav-auth";

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

  const links = useMemo<NavItem[]>(() => {
    const publicLinks: NavItem[] = [{ href: "/courses", label: "Courses" }, { href: "/pricing", label: "Pricing" }];

    if (!session) return publicLinks;

    return [
      { href: "/courses", label: "Courses" },
      { href: "/my-courses", label: "My Courses" },
      { href: "/payments", label: "Payments" },
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
            <span className="gradient-text brand-wordmark">Bankable</span>
          </Link>
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

