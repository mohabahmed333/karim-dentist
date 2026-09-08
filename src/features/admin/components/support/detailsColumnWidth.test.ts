import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  DETAILS_WIDTH_DEFAULT,
  DETAILS_WIDTH_MAX,
  DETAILS_WIDTH_MIN,
  clampDetailsWidth,
  nextDetailsWidthFromDrag,
} from "./detailsColumnWidth.ts";

test("clamps details width between min and max", () => {
  assert.equal(clampDetailsWidth(100), DETAILS_WIDTH_MIN);
  assert.equal(clampDetailsWidth(900), DETAILS_WIDTH_MAX);
  assert.equal(clampDetailsWidth(DETAILS_WIDTH_DEFAULT), DETAILS_WIDTH_DEFAULT);
});

test("drag right shrinks details in LTR", () => {
  assert.equal(nextDetailsWidthFromDrag(300, 100, 140, false), 260);
  assert.equal(nextDetailsWidthFromDrag(300, 100, 60, false), 340);
});

test("drag right grows details in RTL", () => {
  assert.equal(nextDetailsWidthFromDrag(300, 100, 140, true), 340);
  assert.equal(nextDetailsWidthFromDrag(300, 100, 60, true), 260);
});
