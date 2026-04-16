import test from "node:test";
import assert from "node:assert/strict";
import { generateCertificateNumber, getCertificatePdfPath, getCertificateVerifyPath } from "./certificates";

test("generateCertificateNumber uses BNK format", () => {
  const number = generateCertificateNumber("financial-planning-masterclass", new Date("2026-01-01T00:00:00Z"));
  assert.match(number, /^BNK-2026-FPM-\d{5}$/);
});

test("certificate helper paths", () => {
  const id = "BNK-2026-FPM-00001";
  assert.equal(getCertificateVerifyPath(id), "/verify/BNK-2026-FPM-00001");
  assert.equal(getCertificatePdfPath(id), "/api/certificates/BNK-2026-FPM-00001/pdf");
});

