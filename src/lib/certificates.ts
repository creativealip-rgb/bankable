export function generateCertificateNumber(courseSlug: string, now = new Date()) {
  const year = now.getFullYear();
  const courseCode = courseSlug
    .split("-")
    .map((w) => w[0]?.toUpperCase())
    .join("")
    .slice(0, 3);
  const random = String(Math.floor(Math.random() * 99999)).padStart(5, "0");
  return `BNK-${year}-${courseCode}-${random}`;
}

export function getCertificateVerifyPath(certificateNumber: string) {
  return `/verify/${encodeURIComponent(certificateNumber)}`;
}

export function getCertificatePdfPath(certificateNumber: string) {
  return `/api/certificates/${encodeURIComponent(certificateNumber)}/pdf`;
}

