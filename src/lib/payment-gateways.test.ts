import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { getTierAmount, verifyMidtransSignature } from "./payment-gateways";

test("getTierAmount returns expected IDR amount", () => {
  assert.equal(getTierAmount("BASIC"), 0);
  assert.equal(getTierAmount("PREMIUM"), 0);
  assert.equal(getTierAmount("LIFETIME"), 29000);
  assert.equal(getTierAmount("FREE"), 0);
});

test("verifyMidtransSignature validates signature", () => {
  process.env.MIDTRANS_SERVER_KEY = "test_server_key";
  const payload = {
    order_id: "ORD-123",
    status_code: "200",
    gross_amount: "99000.00",
  } as Record<string, unknown>;
  const signature = crypto
    .createHash("sha512")
    .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`)
    .digest("hex");
  payload.signature_key = signature;
  assert.equal(verifyMidtransSignature(payload), true);
});

