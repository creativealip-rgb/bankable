import { headers } from "next/headers";
import { auth } from "./auth";

/**
 * Get the current session. Returns null if not authenticated.
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Require authentication. Throws a Response with 401 if not authenticated.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session;
}

/**
 * Require admin role. Throws a Response with 403 if not admin.
 */
export async function requireAdmin() {
  const session = await requireAuth();
  const role = (session.user as Record<string, unknown>).role as string;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    throw new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session;
}

/**
 * Require member role (any authenticated user).
 */
export async function requireMember() {
  return requireAuth();
}
