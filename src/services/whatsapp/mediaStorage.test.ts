import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildWhatsappMediaPath } from "./mediaStorage.ts";

test("buildWhatsappMediaPath scopes the path by conversation and keeps the extension", () => {
  const path = buildWhatsappMediaPath(
    "conv-1",
    "photo.JPG",
    1700000000000,
    "abcd1234",
  );
  assert.equal(path, "whatsapp/conv-1/1700000000000-abcd1234.jpg");
});

test("buildWhatsappMediaPath falls back to bin when there is no extension", () => {
  const path = buildWhatsappMediaPath(
    "conv-1",
    "noext",
    1700000000000,
    "abcd1234",
  );
  assert.equal(path, "whatsapp/conv-1/1700000000000-abcd1234.bin");
});
