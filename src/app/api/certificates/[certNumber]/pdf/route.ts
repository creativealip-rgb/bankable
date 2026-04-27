import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PDFDocument, StandardFonts, rgb, degrees, type PDFPage, type PDFFont, type RGB } from "pdf-lib";
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
  const page = doc.addPage([595, 842]); // A4 portrait (pt)
  const width = page.getWidth();
  const height = page.getHeight();
  const titleFont = await doc.embedFont(StandardFonts.TimesRomanBoldItalic);
  const nameFont = await doc.embedFont(StandardFonts.TimesRomanBold);
  const bodyFont = await doc.embedFont(StandardFonts.TimesRoman);
  const detailFont = await doc.embedFont(StandardFonts.Helvetica);
  const qrImage = await doc.embedPng(qrBytes);
  const name = cert.user.name || "Member";
  const issuedDate = cert.issuedAt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const score = `${Number(cert.score).toFixed(0)}%`;

  // Colors
  const paperColor = rgb(1, 0.99, 0.96); // #fffdf5
  const goldColor = rgb(0.70, 0.32, 0.03); // #b45309
  const darkBlue = rgb(0.12, 0.11, 0.29); // #1e1b4b
  const mutedText = rgb(0.28, 0.33, 0.41); // #475569

  // 1. Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height,
    color: paperColor,
  });

  // 2. Outer Border (Double)
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: goldColor,
    borderWidth: 2,
  });
  page.drawRectangle({
    x: 26,
    y: 26,
    width: width - 52,
    height: height - 52,
    borderColor: goldColor,
    borderWidth: 0.5,
  });

  // 3. Watermark
  const watermarkText = "BELAJARIA";
  const watermarkSize = 80;
  const watermarkWidth = bodyFont.widthOfTextAtSize(watermarkText, watermarkSize);
  page.drawText(watermarkText, {
    x: width / 2 - watermarkWidth / 2,
    y: height / 2,
    size: watermarkSize,
    font: bodyFont,
    color: goldColor,
    opacity: 0.04,
    rotate: degrees(-30),
  });

  // 4. Header
  drawCenteredText(page, "BELAJARIA", detailFont, 12, height - 80, darkBlue);
  drawCenteredText(page, "Verification of Completion", titleFont, 32, height - 125, darkBlue);

  // 5. Body
  drawCenteredText(page, "This is to certify that the record for", bodyFont, 14, height - 180, mutedText);
  drawCenteredText(page, name, nameFont, 42, height - 235, darkBlue);
  drawCenteredText(page, "is a verified completion of the professional course:", bodyFont, 13, height - 275, mutedText);

  const courseLines = wrapCenteredText(`"${cert.course.title}"`, detailFont, 22, width - 120);
  courseLines.forEach((line, index) => {
    drawCenteredText(page, line, detailFont, 22, height - 315 - index * 28, goldColor);
  });

  // 6. Stats Row
  const statsY = height - 400;
  drawCenteredText(page, `Final Score: ${score}   •   Date: ${issuedDate}`, bodyFont, 12, statsY, mutedText);

  // 7. Separator Line
  page.drawLine({
    start: { x: 100, y: height - 450 },
    end: { x: width - 100, y: height - 450 },
    thickness: 0.5,
    color: goldColor,
    opacity: 0.2,
  });

  // 8. Footer Section (Seal & Meta)
  const sealX = 80;
  const footerY = 220; // Lowered to match web
  
  // Seal
  page.drawCircle({
    x: sealX + 30,
    y: footerY + 30,
    size: 30,
    borderColor: goldColor,
    borderWidth: 1,
    color: rgb(0.98, 0.75, 0.14),
    opacity: 0.05,
  });
  page.drawText("VERIFIED", { x: sealX + 16, y: footerY + 33, size: 6, font: detailFont, color: goldColor });
  page.drawText("RECORD", { x: sealX + 19, y: footerY + 24, size: 6, font: detailFont, color: goldColor });

  // Meta
  const metaX = width - 230;
  page.drawText(`Certificate ID: ${cert.certificateNumber}`, { x: metaX, y: footerY + 35, size: 8, font: detailFont, color: mutedText });
  page.drawText("AUTHENTIC CERTIFICATE", { x: metaX, y: footerY + 24, size: 8, font: detailFont, color: rgb(0.06, 0.72, 0.51) });

  // 9. QR Code
  const qrSize = 80;
  page.drawImage(qrImage, { x: width / 2 - qrSize / 2, y: 80, width: qrSize, height: qrSize });
  drawCenteredText(page, "Scan to verify record", detailFont, 7, 70, mutedText);

  // 10. URL
  page.drawText(verifyUrl, { x: 50, y: 45, size: 7, font: detailFont, color: mutedText, opacity: 0.5 });

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

