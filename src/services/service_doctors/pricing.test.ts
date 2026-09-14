import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractSingleAmount,
  formatPriceRangeLabel,
  isPriceEgpWithinRange,
  resolveServiceDoctorPrice,
} from "./pricing";

describe("resolveServiceDoctorPrice", () => {
  const mappings = {
    "svc-1": [
      { doctorId: "doc-a", priceLabel: "EGP 900" },
      { doctorId: "doc-b", priceLabel: null },
    ],
  };

  it("prefers the doctor's own override", () => {
    assert.equal(resolveServiceDoctorPrice("svc-1", "doc-a", mappings, "EGP 500"), "EGP 900");
  });

  it("falls back to the clinic default when the doctor has no override", () => {
    assert.equal(resolveServiceDoctorPrice("svc-1", "doc-b", mappings, "EGP 500"), "EGP 500");
  });

  it("falls back to the clinic default when the doctor isn't mapped at all", () => {
    assert.equal(resolveServiceDoctorPrice("svc-1", "doc-c", mappings, "EGP 500"), "EGP 500");
  });

  it("resolves to nothing when neither exists", () => {
    assert.equal(resolveServiceDoctorPrice("svc-2", "doc-a", mappings, null), null);
  });
});

describe("extractSingleAmount", () => {
  it("pulls the number out of a plain figure", () => {
    assert.equal(extractSingleAmount("EGP 800"), "800");
  });

  it("pulls the base figure out of an open-ended 'from' price", () => {
    assert.equal(extractSingleAmount("From EGP 800"), "800");
  });

  it("refuses a range rather than guessing which end", () => {
    assert.equal(extractSingleAmount("EGP 300-600"), null);
  });

  it("refuses text with no number at all", () => {
    assert.equal(extractSingleAmount("Ask at the front desk"), null);
  });

  it("handles a decimal figure", () => {
    assert.equal(extractSingleAmount("EGP 799.50"), "799.50");
  });

  it("returns null for an empty label", () => {
    assert.equal(extractSingleAmount(null), null);
    assert.equal(extractSingleAmount(""), null);
  });
});

describe("formatPriceRangeLabel", () => {
  it("formats a real range", () => {
    assert.equal(formatPriceRangeLabel(300, 600), "EGP 300-600");
  });

  it("collapses an equal min/max into one figure", () => {
    assert.equal(formatPriceRangeLabel(800, 800), "EGP 800");
  });

  it("uses whichever bound is set when only one is", () => {
    assert.equal(formatPriceRangeLabel(300, null), "EGP 300");
    assert.equal(formatPriceRangeLabel(null, 600), "EGP 600");
  });

  it("returns null when nothing is on file", () => {
    assert.equal(formatPriceRangeLabel(null, null), null);
  });
});

describe("isPriceEgpWithinRange", () => {
  it("accepts a price inside the range", () => {
    assert.equal(isPriceEgpWithinRange(450, 300, 600), true);
  });

  it("accepts a price sitting exactly on the floor", () => {
    assert.equal(isPriceEgpWithinRange(300, 300, 600), true);
  });

  it("accepts a price sitting exactly on the ceiling", () => {
    assert.equal(isPriceEgpWithinRange(600, 300, 600), true);
  });

  it("refuses a price under the floor", () => {
    assert.equal(isPriceEgpWithinRange(250, 300, 600), false);
  });

  it("refuses a price over the ceiling", () => {
    assert.equal(isPriceEgpWithinRange(650, 300, 600), false);
  });

  it("treats a single-figure clinic price as its own floor and ceiling", () => {
    assert.equal(isPriceEgpWithinRange(900, 800, 800), false);
    assert.equal(isPriceEgpWithinRange(800, 800, 800), true);
  });

  it("allows a null doctor price — nothing overridden, nothing to check", () => {
    assert.equal(isPriceEgpWithinRange(null, 300, 600), true);
  });

  it("allows any doctor price when the clinic has no floor or ceiling on file", () => {
    assert.equal(isPriceEgpWithinRange(50, null, null), true);
  });

  it("still enforces a floor when only the floor is set", () => {
    assert.equal(isPriceEgpWithinRange(250, 300, null), false);
    assert.equal(isPriceEgpWithinRange(300, 300, null), true);
  });

  it("still enforces a ceiling when only the ceiling is set", () => {
    assert.equal(isPriceEgpWithinRange(650, null, 600), false);
    assert.equal(isPriceEgpWithinRange(600, null, 600), true);
  });
});
