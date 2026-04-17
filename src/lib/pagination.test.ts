import test from "node:test";
import assert from "node:assert/strict";
import { parsePagination, parsePositiveInt } from "./pagination";

test("parsePositiveInt clamps values", () => {
  assert.equal(parsePositiveInt("5", 1, 1, 10), 5);
  assert.equal(parsePositiveInt("-9", 1, 1, 10), 1);
  assert.equal(parsePositiveInt("99", 1, 1, 10), 10);
  assert.equal(parsePositiveInt(null, 7, 1, 10), 7);
});

test("parsePagination returns page, pageSize, offset", () => {
  const params = new URLSearchParams({ page: "3", pageSize: "25" });
  const parsed = parsePagination(params, { page: 1, pageSize: 20 });
  assert.deepEqual(parsed, { page: 3, pageSize: 25, offset: 50 });
});

