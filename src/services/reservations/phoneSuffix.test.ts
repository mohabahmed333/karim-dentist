import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { phoneSuffixForLookup } from "./phoneSuffix.ts";

describe("phoneSuffixForLookup", () => {
  it("takes the last 8 digits of a full international number", () => {
    assert.equal(phoneSuffixForLookup("+20 100 123 4567"), "01234567");
  });

  it("ignores formatting, so stored and inbound formats agree", () => {
    const expected = "01234567";
    for (const p of [
      "+201001234567",
      "00201001234567",
      "01001234567",
      "0100-123-4567",
      "(0100) 123 4567",
    ]) {
      assert.equal(phoneSuffixForLookup(p), expected, p);
    }
  });

  /**
   * The suffix is only a *narrowing* filter for SQL; phonesMatch() still makes
   * the final decision in JS. Canonicalization (00-strip, 01→201) only ever
   * rewrites the prefix, so the last 8 digits survive it — which is what makes
   * suffix matching a safe superset.
   */
  it("is stable under the canonicalization the app applies", () => {
    assert.equal(
      phoneSuffixForLookup("01001234567"),
      phoneSuffixForLookup("201001234567"),
    );
  });

  it("returns the whole string for numbers shorter than 8 digits", () => {
    assert.equal(phoneSuffixForLookup("12345"), "12345");
  });

  it("returns null when there are no digits", () => {
    assert.equal(phoneSuffixForLookup(""), null);
    assert.equal(phoneSuffixForLookup("   "), null);
    assert.equal(phoneSuffixForLookup("not-a-phone"), null);
  });
});
