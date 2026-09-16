import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bundleForPatient } from "./myDayBundle.ts";

describe("bundleForPatient", () => {
  const bundle = { patientKey: "phone:201", balance: 100 };

  it("passes the bundle through for the patient it belongs to", () => {
    assert.equal(bundleForPatient(bundle, "phone:201"), bundle);
  });

  it("withholds the previous patient's bundle while the next one loads", () => {
    assert.equal(bundleForPatient(bundle, "phone:999"), null);
  });

  it("withholds when either side is missing", () => {
    assert.equal(bundleForPatient(null, "phone:201"), null);
    assert.equal(bundleForPatient(undefined, "phone:201"), null);
    assert.equal(bundleForPatient(bundle, null), null);
    assert.equal(bundleForPatient(bundle, undefined), null);
  });
});
