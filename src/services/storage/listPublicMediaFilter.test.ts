import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { isPublicImageName } from "./listPublicMediaFilter.ts";

test("accepts common image extensions case-insensitively", () => {
  assert.equal(isPublicImageName("shot.PNG"), true);
  assert.equal(isPublicImageName("a.jpg"), true);
  assert.equal(isPublicImageName("b.JPEG"), true);
  assert.equal(isPublicImageName("c.webp"), true);
  assert.equal(isPublicImageName("d.gif"), true);
  assert.equal(isPublicImageName("e.svg"), true);
});

test("rejects non-image and extension-less names", () => {
  assert.equal(isPublicImageName("clip.mp4"), false);
  assert.equal(isPublicImageName("notes.pdf"), false);
  assert.equal(isPublicImageName("noext"), false);
  assert.equal(isPublicImageName(".hidden"), false);
});
