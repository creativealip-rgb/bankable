import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/auth-helpers";

// GET /api/certificates — List user's certificates
export async function GET() {
  try {
    const session = await requireMember();

    const certs = await db.query.certificates.findMany({
      where: eq(certificates.userId, session.user.id),
      with: {
        course: {
          columns: { id: true, title: true, slug: true, thumbnail: true },
        },
      },
      orderBy: (certificates, { desc }) => [desc(certificates.issuedAt)],
    });

    return NextResponse.json(certs);
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Failed to fetch certificates:", error);
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
}
