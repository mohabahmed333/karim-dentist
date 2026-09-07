import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  CAROUSEL_NEAR_END_THRESHOLD,
  isNearCarouselEnd,
  shouldFireNearEnd,
} from "./carouselNearEnd.ts";

test("treats high scroll progress as near the end", () => {
  assert.equal(isNearCarouselEnd(0.9, true), true);
  assert.equal(isNearCarouselEnd(0.5, true), false);
  assert.equal(CAROUSEL_NEAR_END_THRESHOLD, 0.82);
});

test("treats no further scroll as near the end even mid-progress", () => {
  assert.equal(isNearCarouselEnd(0.4, false), true);
});

test("near-end callback fires once until the lock resets", () => {
  assert.equal(shouldFireNearEnd(false, 0.9, true), true);
  assert.equal(shouldFireNearEnd(true, 0.9, true), false);
  assert.equal(shouldFireNearEnd(false, 0.4, true), false);
});
