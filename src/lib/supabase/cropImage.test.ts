import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { shouldCropImage } from "./cropImage.ts";

test("crops jpeg png webp", () => {
  assert.equal(
    shouldCropImage(new File([new Uint8Array([1])], "a.jpg", { type: "image/jpeg" })),
    true,
  );
  assert.equal(
    shouldCropImage(new File([new Uint8Array([1])], "a.png", { type: "image/png" })),
    true,
  );
  assert.equal(
    shouldCropImage(new File([new Uint8Array([1])], "a.webp", { type: "image/webp" })),
    true,
  );
});

test("skips svg and gif", () => {
  assert.equal(
    shouldCropImage(new File([new Uint8Array([1])], "a.svg", { type: "image/svg+xml" })),
    false,
  );
  assert.equal(
    shouldCropImage(new File([new Uint8Array([1])], "a.gif", { type: "image/gif" })),
    false,
  );
  assert.equal(
    shouldCropImage(new File([new Uint8Array([1])], "a.SVG", { type: "" })),
    false,
  );
});
