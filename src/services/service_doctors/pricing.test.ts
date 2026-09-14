import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractSingleAmount, resolveServiceDoctorPrice } from "./pricing";

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
