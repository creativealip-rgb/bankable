import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont, type RGB } from "pdf-lib";
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
  const page = doc.addPage([842, 595]); // A4 landscape (pt)
  const width = page.getWidth();
  const height = page.getHeight();
  const titleFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await doc.embedFont(StandardFonts.Helvetica);
  const qrImage = await doc.embedPng(qrBytes);
  const name = cert.user.name || "Member";
  const issuedDate = cert.issuedAt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const score = `${Number(cert.score).toFixed(0)}%`;

  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    color: rgb(0.07, 0.09, 0.14),
    borderWidth: 1.5,
    borderColor: rgb(0.98, 0.8, 0.08),
  });

  page.drawRectangle({
    x: 24,
    y: height - 32,
    width: width - 48,
    height: 8,
    color: rgb(0.31, 0.27, 0.90),
  });

  drawCenteredText(page, "BELAJARIA", titleFont, 30, height - 86, rgb(0.31, 0.27, 0.90));
  drawCenteredText(page, "Certificate of Completion", bodyFont, 15, height - 118, rgb(0.86, 0.88, 0.92));
  drawCenteredText(page, "This certifies that", bodyFont, 13, height - 168, rgb(0.75, 0.78, 0.83));
  drawCenteredText(page, name, titleFont, 34, height - 212, rgb(1, 1, 1));
  drawCenteredText(page, "has successfully completed the course", bodyFont, 12, height - 246, rgb(0.75, 0.78, 0.83));

  const courseLines = wrapCenteredText(`"${cert.course.title}"`, titleFont, 20, width - 220);
  courseLines.forEach((line, index) => {
    drawCenteredText(page, line, titleFont, 20, height - 282 - index * 26, rgb(0.98, 0.8, 0.08));
  });

  const metaY = height - 378;
  drawCenteredText(page, `Score: ${score}   -   Date: ${issuedDate}`, bodyFont, 12, metaY, rgb(0.9, 0.92, 0.96));
  drawCenteredText(page, cert.certificateNumber, bodyFont, 11, metaY - 28, rgb(0.7, 0.74, 0.8));
  drawCenteredText(page, "Verified Certificate", bodyFont, 11, metaY - 54, rgb(0.25, 0.82, 0.6));

  page.drawImage(qrImage, { x: width - 184, y: 54, width: 120, height: 120 });
  drawCenteredText(page, "Scan to verify", bodyFont, 10, 42, rgb(0.75, 0.78, 0.83), width - 124);
  page.drawText(verifyUrl, { x: 54, y: 56, size: 8.5, font: bodyFont, color: rgb(0.55, 0.58, 0.63) });

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

function drawCenteredText(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  y: number,
  color: RGB,
  centerX?: number
) {
  const targetCenter = centerX ?? page.getWidth() / 2;
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: targetCenter - textWidth / 2,
    y,
    size,
    font,
    color,
  });
}

function wrapCenteredText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

