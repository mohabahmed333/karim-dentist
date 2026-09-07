import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { textDirection } from "./textDirection.ts";

describe("textDirection", () => {
  it("returns rtl for Arabic", () => {
    assert.equal(textDirection("مرحبا بك"), "rtl");
  });

  it("returns ltr for English", () => {
    assert.equal(textDirection("Hello there"), "ltr");
  });

  it("prefers majority script", () => {
    assert.equal(textDirection("مرحبا hello"), "rtl");
    assert.equal(textDirection("Hello مرحبا world"), "ltr");
  });
});
