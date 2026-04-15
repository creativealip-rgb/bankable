"use client";

import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function NavAuth() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) {
    return <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>...</span>;
  }

  if (session) {
    const role = (session.user as Record<string, unknown>).role as string;
    return (
      <>
        {role === "ADMIN" && (
          <Link href="/admin" style={{ color: "var(--secondary)", fontWeight: 600, fontSize: "0.9rem" }}>
            Admin
          </Link>
        )}
        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          {session.user.name}
        </span>
        <button
          onClick={async () => {
            await signOut();
            router.push("/");
            router.refresh();
          }}
          style={{
            color: "var(--text-muted)",
            fontSize: "0.9rem",
            cursor: "pointer",
            background: "none",
            border: "none",
            fontFamily: "var(--font-sans)",
          }}
        >
          Logout
        </button>
      </>
    );
  }

  return (
    <>
      <Link href="/login" style={{ color: "var(--text-muted)" }}>Login</Link>
      <Link href="/register" className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>Join Now</Link>
    </>
  );
}
