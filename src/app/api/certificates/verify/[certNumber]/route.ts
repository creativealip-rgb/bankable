import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ certNumber: string }> };

// GET /api/certificates/verify/[certNumber] — Public certificate verification
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { certNumber } = await params;

  try {
    const cert = await db.query.certificates.findFirst({
      where: eq(certificates.certificateNumber, certNumber),
      with: {
        user: {
          columns: { id: true, name: true, image: true },
        },
        course: {
          columns: { id: true, title: true, slug: true },
        },
      },
    });

    if (!cert) {
      return NextResponse.json(
        { valid: false, error: "Certificate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      certificate: {
        certificateNumber: cert.certificateNumber,
        holderName: cert.user.name,
        courseTitle: cert.course.title,
        score: cert.score,
        issuedAt: cert.issuedAt,
      },
    });
  } catch (error) {
    console.error("Failed to verify certificate:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
