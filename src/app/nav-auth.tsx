"use client";

import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export function NavAuth() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isPending) {
    return <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>...</span>;
  }

  if (session) {
    const role = (session.user as Record<string, unknown>).role as string;
    const initial = session.user.name?.charAt(0)?.toUpperCase() || "?";

    return (
      <div ref={menuRef} style={{ position: "relative" }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            background: "none", border: "none", cursor: "pointer", color: "var(--text-main)",
            fontFamily: "var(--font-sans)", fontSize: "0.9rem",
          }}
        >
          <span style={{
            width: "32px", height: "32px", borderRadius: "10px",
            background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(192,132,252,0.2))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "0.85rem", color: "var(--primary)",
          }}>
            {initial}
          </span>
          {session.user.name}
          <span style={{ fontSize: "0.7rem" }}>▾</span>
        </button>

        {menuOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            background: "var(--surface)", border: "1px solid rgba(63,63,70,0.4)",
            borderRadius: "14px", padding: "0.5rem", minWidth: "200px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.4)", zIndex: 50,
          }}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(63,63,70,0.3)", marginBottom: "0.25rem" }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{session.user.name}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{session.user.email}</div>
            </div>

            {[
              { href: "/my-courses", label: "📚 My Courses" },
              { href: "/certificates", label: "🏆 Certificates" },
              { href: "/profile", label: "👤 Profile" },
              { href: "/billing", label: "💳 Billing" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block", padding: "0.6rem 1rem", borderRadius: "8px",
                  fontSize: "0.88rem", color: "var(--text-main)", textDecoration: "none",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(34,211,238,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {item.label}
              </Link>
            ))}

            {(role === "ADMIN" || role === "SUPER_ADMIN") && (
              <>
                <div style={{ height: "1px", background: "rgba(63,63,70,0.3)", margin: "0.25rem 0" }}></div>
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: "block", padding: "0.6rem 1rem", borderRadius: "8px",
                    fontSize: "0.88rem", color: "var(--secondary)", fontWeight: 600, textDecoration: "none",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(192,132,252,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  ⚙️ Admin Panel
                </Link>
              </>
            )}

            <div style={{ height: "1px", background: "rgba(63,63,70,0.3)", margin: "0.25rem 0" }}></div>
            <button
              onClick={async () => {
                await signOut();
                setMenuOpen(false);
                router.push("/");
                router.refresh();
              }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "0.6rem 1rem", borderRadius: "8px",
                fontSize: "0.88rem", color: "var(--danger)",
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "var(--font-sans)", transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(248,113,113,0.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Link href="/login" style={{ color: "var(--text-muted)" }}>Login</Link>
      <Link href="/register" className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>Join Now</Link>
    </>
  );
}
