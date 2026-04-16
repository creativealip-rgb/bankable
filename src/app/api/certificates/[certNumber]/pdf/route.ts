import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

type RouteParams = { params: Promise<{ certNumber: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { certNumber } = await params;

  const cert = await db.query.certificates.findFirst({
    where: eq(certificates.certificateNumber, certNumber),
    with: {
      user: { columns: { name: true } },
      course: { columns: { title: true } },
    },
  });

  if (!cert) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify/${encodeURIComponent(certNumber)}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 256 });
  const qrBytes = Uint8Array.from(Buffer.from(qrDataUrl.split(",")[1], "base64"));

  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]);
  const width = page.getWidth();
  const height = page.getHeight();
  const titleFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await doc.embedFont(StandardFonts.Helvetica);
  const qrImage = await doc.embedPng(qrBytes);

  page.drawRectangle({ x: 30, y: 30, width: width - 60, height: height - 60, borderWidth: 2, borderColor: rgb(0.13, 0.84, 0.93) });
  page.drawText("BANKABLE", { x: 350, y: 520, size: 28, font: titleFont, color: rgb(0.13, 0.84, 0.93) });
  page.drawText("Certificate of Completion", { x: 300, y: 485, size: 16, font: bodyFont });
  page.drawText("This certifies that", { x: 360, y: 430, size: 14, font: bodyFont });
  page.drawText(cert.user.name, { x: 260, y: 390, size: 26, font: titleFont });
  page.drawText("has successfully completed the course", { x: 285, y: 355, size: 12, font: bodyFont });
  page.drawText(`"${cert.course.title}"`, { x: 220, y: 325, size: 18, font: titleFont });
  page.drawText(`Score: ${Number(cert.score).toFixed(0)}%`, { x: 90, y: 250, size: 13, font: bodyFont });
  page.drawText(`Issued: ${cert.issuedAt.toLocaleDateString("id-ID")}`, { x: 90, y: 225, size: 13, font: bodyFont });
  page.drawText(`Certificate ID: ${cert.certificateNumber}`, { x: 90, y: 200, size: 13, font: bodyFont });
  page.drawImage(qrImage, { x: 650, y: 90, width: 130, height: 130 });
  page.drawText("Scan to verify", { x: 672, y: 75, size: 10, font: bodyFont });
  page.drawText(verifyUrl, { x: 90, y: 90, size: 8, font: bodyFont, color: rgb(0.35, 0.35, 0.35) });

  const bytes = await doc.save();
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${cert.certificateNumber}.pdf"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

