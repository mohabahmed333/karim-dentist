import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  patientTabTransition,
  patientTabVariants,
} from "./patientTabMotion.ts";

describe("patientTabMotion", () => {
  it("fades a tab out upward and the next one in from below", () => {
    const variants = patientTabVariants(false);
    assert.deepEqual(variants.enter, { opacity: 0, y: 6 });
    assert.deepEqual(variants.center, { opacity: 1, y: 0 });
    assert.deepEqual(variants.exit, { opacity: 0, y: -6 });
  });

  it("holds everything still when reduced motion is on", () => {
    const variants = patientTabVariants(true);
    for (const state of ["enter", "center", "exit"] as const) {
      assert.deepEqual(variants[state], { opacity: 1, y: 0 });
    }
    assert.equal(patientTabTransition(true).duration, 0.01);
  });

  it("stays quick enough to tab through", () => {
    const duration = patientTabTransition(false).duration;
    assert.ok(typeof duration === "number" && duration <= 0.25);
  });
});
