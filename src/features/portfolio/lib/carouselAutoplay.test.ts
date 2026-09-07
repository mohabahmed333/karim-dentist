import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  loopCopiesForSlides,
  nextAutoplayIndex,
  repeatForInfiniteLoop,
} from "./carouselAutoplay.ts";

test("autoplay advances and wraps forever", () => {
  assert.equal(nextAutoplayIndex(0, 4), 1);
  assert.equal(nextAutoplayIndex(3, 4), 0);
});

test("duplicates short lists so Embla can loop infinitely", () => {
  assert.equal(loopCopiesForSlides(3, 12), 4);
  assert.equal(loopCopiesForSlides(8, 12), 2);
  assert.deepEqual(repeatForInfiniteLoop(["a", "b"], 4), [
    "a",
    "b",
    "a",
    "b",
  ]);
});
