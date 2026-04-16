import test from "node:test";
import assert from "node:assert/strict";
import { paymentHasCourseSlug } from "./course-access";

test("paymentHasCourseSlug returns true when provider payload has courseSlug", () => {
  assert.equal(paymentHasCourseSlug({ courseSlug: "premium-growth-webinar" }), true);
});

test("paymentHasCourseSlug returns false for non course payload", () => {
  assert.equal(paymentHasCourseSlug({ mode: "MANUAL" }), false);
  assert.equal(paymentHasCourseSlug(null), false);
  assert.equal(paymentHasCourseSlug("invalid"), false);
});

