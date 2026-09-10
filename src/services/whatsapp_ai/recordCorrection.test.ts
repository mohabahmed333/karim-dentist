import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { wasEdited } from "./recordCorrection.ts";

describe("wasEdited", () => {
  it("sees a real rewrite", () => {
    assert.equal(
      wasEdited("We open at 10.", "We're open from 10am to 6pm, Sunday to Thursday."),
      true,
    );
  });

  it("ignores whitespace and case, which are not corrections", () => {
    // Otherwise the review queue fills with noise and staff stop reading it.
    assert.equal(wasEdited("We open at 10.", "  we open at 10.  "), false);
    assert.equal(wasEdited("مرحبا  بك", "مرحبا بك"), false);
  });

  it("treats an unchanged Arabic draft as endorsed", () => {
    assert.equal(wasEdited("إحنا مفتوحين من ١٠ لـ ٦.", "إحنا مفتوحين من ١٠ لـ ٦."), false);
  });

  it("catches a small but meaningful edit", () => {
    // Changing a price is exactly the correction worth reviewing.
    assert.equal(wasEdited("A filling is 800 EGP.", "A filling is 900 EGP."), true);
  });
});
