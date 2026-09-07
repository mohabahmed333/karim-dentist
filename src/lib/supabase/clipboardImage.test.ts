import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { imageFileFromClipboard } from "./clipboardImage.ts";

test("returns null when clipboard has no image", () => {
  const data = {
    items: [{ type: "text/plain", getAsFile: () => null }],
    files: [],
  };
  assert.equal(imageFileFromClipboard(data as never), null);
  assert.equal(imageFileFromClipboard(null), null);
});

test("builds a screenshot file from an image clipboard item", () => {
  const blob = new File([new Uint8Array([1, 2, 3])], "image.png", {
    type: "image/png",
  });
  const data = {
    items: [
      {
        type: "image/png",
        getAsFile: () => blob,
      },
    ],
    files: [blob],
  };
  const file = imageFileFromClipboard(data as never);
  assert.ok(file);
  assert.equal(file.type, "image/png");
  assert.match(file.name, /^screenshot-\d+\.png$/);
});
