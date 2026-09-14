import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractPriceRange,
  extractSingleAmount,
  isPriceWithinClinicRange,
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

describe("extractPriceRange", () => {
  it("reads a real range as [min, max]", () => {
    assert.deepEqual(extractPriceRange("EGP 300-600"), { min: 300, max: 600 });
  });

  it("still resolves a range written high-to-low", () => {
    assert.deepEqual(extractPriceRange("EGP 600-300"), { min: 300, max: 600 });
  });

  it("treats a single figure as a one-point range", () => {
    assert.deepEqual(extractPriceRange("EGP 800"), { min: 800, max: 800 });
  });

  it("treats an open-ended 'from' price the same way", () => {
    assert.deepEqual(extractPriceRange("From EGP 800"), { min: 800, max: 800 });
  });

  it("gives up on text with no number", () => {
    assert.equal(extractPriceRange("Ask at the front desk"), null);
  });

  it("gives up on more than two numbers — nothing sane to bound", () => {
    assert.equal(extractPriceRange("EGP 300, 450 or 600"), null);
  });

  it("returns null for an empty label", () => {
    assert.equal(extractPriceRange(null), null);
  });
});

describe("isPriceWithinClinicRange", () => {
  it("accepts a doctor price inside the clinic's range", () => {
    assert.equal(isPriceWithinClinicRange("EGP 450", "EGP 300-600"), true);
  });

  it("accepts a doctor price sitting exactly on the floor", () => {
    assert.equal(isPriceWithinClinicRange("EGP 300", "EGP 300-600"), true);
  });

  it("accepts a doctor price sitting exactly on the ceiling", () => {
    assert.equal(isPriceWithinClinicRange("EGP 600", "EGP 300-600"), true);
  });

  it("refuses a doctor price under the clinic's floor", () => {
    assert.equal(isPriceWithinClinicRange("EGP 250", "EGP 300-600"), false);
  });

  it("refuses a doctor price over the clinic's ceiling", () => {
    assert.equal(isPriceWithinClinicRange("EGP 650", "EGP 300-600"), false);
  });

  it("treats a single-figure clinic price as its own floor and ceiling", () => {
    assert.equal(isPriceWithinClinicRange("EGP 900", "EGP 800"), false);
    assert.equal(isPriceWithinClinicRange("EGP 800", "EGP 800"), true);
  });

  it("allows a blank doctor price — nothing overridden, nothing to check", () => {
    assert.equal(isPriceWithinClinicRange(null, "EGP 300-600"), true);
    assert.equal(isPriceWithinClinicRange("", "EGP 300-600"), true);
  });

  it("allows a doctor price that isn't a single clean number — can't compare it honestly", () => {
    assert.equal(isPriceWithinClinicRange("Ask at the front desk", "EGP 300-600"), true);
  });

  it("allows any doctor price when the clinic has no price on file at all", () => {
    assert.equal(isPriceWithinClinicRange("EGP 50", null), true);
  });

  it("allows any doctor price when the clinic price itself isn't comparable", () => {
    assert.equal(isPriceWithinClinicRange("EGP 50", "Ask at the front desk"), true);
  });
});
