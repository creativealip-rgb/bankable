import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasMainCatalogAccess } from "@/lib/course-entitlement";

// GET /api/access/main — Check whether current user has main catalog access
export async function GET() {
  try {
    const session = await requireAuth();
    const role = (session.user as Record<string, unknown>).role as string | undefined;
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    const hasMainAccess = isAdmin ? true : await hasMainCatalogAccess(session.user.id);
    return NextResponse.json({ hasMainAccess, isAdmin });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json({ error: "Failed to check access" }, { status: 500 });
  }
}

