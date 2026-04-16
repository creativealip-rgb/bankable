import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/me — Current user profile
export async function GET() {
  try {
    const session = await requireAuth();

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      with: {
        memberships: {
          orderBy: (memberships, { desc }) => [desc(memberships.createdAt)],
          limit: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      membership: user.memberships[0] || null,
      createdAt: user.createdAt,
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to fetch profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

async function updateProfile(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { name, image } = body;

    const [updated] = await db
      .update(users)
      .set({
        ...(name && { name }),
        ...(image !== undefined && { image }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning();

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      image: updated.image,
      role: updated.role,
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to update profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

// PUT /api/me — Update profile
export async function PUT(request: NextRequest) {
  return updateProfile(request);
}

// PATCH /api/me — Update profile (alias for compatibility)
export async function PATCH(request: NextRequest) {
  return updateProfile(request);
}

// DELETE /api/me — Delete current account
export async function DELETE() {
  try {
    const session = await requireAuth();
    await db.delete(users).where(eq(users.id, session.user.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to delete account:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
