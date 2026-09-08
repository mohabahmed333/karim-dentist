import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { lastStrongLocale, textDirection } from "./textDirection.ts";

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

describe("lastStrongLocale", () => {
  it("returns null when there are no letters", () => {
    assert.equal(lastStrongLocale(""), null);
    assert.equal(lastStrongLocale("/"), null);
    assert.equal(lastStrongLocale(" / 12"), null);
  });

  it("tracks the most recent typed script", () => {
    assert.equal(lastStrongLocale("Hello"), "en");
    assert.equal(lastStrongLocale("مرحبا"), "ar");
    assert.equal(lastStrongLocale("Hello مرحبا"), "ar");
    assert.equal(lastStrongLocale("مرحبا Hello"), "en");
    assert.equal(lastStrongLocale("hi /gre"), "en");
  });
});
