import { test } from "node:test";
import assert from "node:assert";
import { calculateStreak } from "./streak";

test("calculateStreak - new user starts at 1", () => {
  const result = calculateStreak(null, 0);
  assert.strictEqual(result.newStreak, 1);
  assert.strictEqual(result.shouldUpdateDate, true);
});

test("calculateStreak - consecutive day increases streak", () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const result = calculateStreak(yesterday, 5);
  assert.strictEqual(result.newStreak, 6);
  assert.strictEqual(result.shouldUpdateDate, true);
});

test("calculateStreak - same day keeps streak", () => {
  const today = new Date();
  
  const result = calculateStreak(today, 5);
  assert.strictEqual(result.newStreak, 5);
  assert.strictEqual(result.shouldUpdateDate, false);
});

test("calculateStreak - gap resets streak to 1", () => {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const result = calculateStreak(lastWeek, 10);
  assert.strictEqual(result.newStreak, 1);
  assert.strictEqual(result.shouldUpdateDate, true);
});
