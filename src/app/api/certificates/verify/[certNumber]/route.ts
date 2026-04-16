import { NextResponse } from "next/server";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCertificatePdfPath, getCertificateVerifyPath } from "@/lib/certificates";

type RouteParams = { params: Promise<{ certNumber: string }> };

// GET /api/certificates/verify/[certNumber] — Public certificate verification
export async function GET(_request: Request, { params }: RouteParams) {
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
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    return NextResponse.json({
      certificateNumber: cert.certificateNumber,
      recipientName: cert.user.name,
      courseName: cert.course.title,
      score: Number(cert.score),
      issuedAt: cert.issuedAt,
      verifyPath: getCertificateVerifyPath(cert.certificateNumber),
      pdfPath: getCertificatePdfPath(cert.certificateNumber),
    });
  } catch (error) {
    console.error("Failed to verify certificate:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
