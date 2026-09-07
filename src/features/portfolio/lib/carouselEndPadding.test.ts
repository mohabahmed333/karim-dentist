import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { carouselEndPadding } from "./carouselEndPadding.ts";

test("carousel edge inset stays a normal page gutter", () => {
  assert.equal(carouselEndPadding(), "var(--page-gutter)");
});

test("start and end insets should match so scroll cannot open a void", () => {
  const gutter = carouselEndPadding();
  assert.equal(gutter, "var(--page-gutter)");
});
