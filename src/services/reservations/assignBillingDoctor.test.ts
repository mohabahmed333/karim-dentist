import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { shouldAssignBillingDoctor } from "./mutations.ts";

describe("shouldAssignBillingDoctor", () => {
  it("fills in an unassigned visit", () => {
    assert.equal(shouldAssignBillingDoctor(null, "doc-1"), true);
  });

  it("leaves another doctor's visit alone", () => {
    assert.equal(shouldAssignBillingDoctor("doc-2", "doc-1"), false);
  });

  it("is a no-op when the visit already names the billing doctor", () => {
    assert.equal(shouldAssignBillingDoctor("doc-1", "doc-1"), false);
  });

  it("writes nothing without a billing doctor", () => {
    assert.equal(shouldAssignBillingDoctor(null, null), false);
  });
});
