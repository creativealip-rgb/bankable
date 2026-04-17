import test from "node:test";
import assert from "node:assert/strict";
import { checkRateLimit } from "./rate-limit";

test("checkRateLimit allows until limit then blocks", () => {
  const key = `test:${Date.now()}:limit`;
  const first = checkRateLimit({ key, limit: 2, windowMs: 60_000 });
  const second = checkRateLimit({ key, limit: 2, windowMs: 60_000 });
  const third = checkRateLimit({ key, limit: 2, windowMs: 60_000 });

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, false);
  assert.ok(third.retryAfterSec >= 1);
});

