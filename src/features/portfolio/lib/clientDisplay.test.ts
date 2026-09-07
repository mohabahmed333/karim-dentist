import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { clientDisplayMode } from "./clientDisplay.ts";

test("prefers logo image when logo_url is set", () => {
  assert.equal(
    clientDisplayMode({ name: "Nike", logo_url: "https://x/logo.png" }),
    "image",
  );
});

test("falls back to text when logo is missing", () => {
  assert.equal(clientDisplayMode({ name: "Nike", logo_url: null }), "text");
  assert.equal(clientDisplayMode({ name: "Nike", logo_url: "  " }), "text");
});
