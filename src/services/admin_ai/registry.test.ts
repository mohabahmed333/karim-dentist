import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { listActionKinds, isWriteAction, getAdapter } from "./registry.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { prescriptionInsertSchema } from "./clinicalPayloads.ts";

describe("admin_ai registry", () => {
  it("registers expected clinical and cms kinds", () => {
    const kinds = listActionKinds();
    assert.ok(kinds.includes("cms.update_singleton"));
    assert.ok(kinds.includes("chart.set_surfaces"));
    assert.ok(kinds.includes("treatment.create"));
    assert.ok(kinds.includes("imaging.attach"));
    assert.ok(kinds.includes("rx.create"));
    assert.ok(kinds.includes("followup.book"));
    assert.equal(isWriteAction("navigate.focus_tooth"), false);
    assert.equal(isWriteAction("note.clinical"), true);
    assert.equal(getAdapter("cms.set_media").kind, "cms.set_media");
  });

  it("requires medication and dose for prescriptions", () => {
    assert.throws(() =>
      prescriptionInsertSchema.parse({
        patient_key: "p1",
        medication: "",
        dose: "500mg",
        frequency: "ONCE_DAILY",
      }),
    );
    const ok = prescriptionInsertSchema.parse({
      patient_key: "p1",
      medication: "Amoxicillin",
      dose: "500mg",
      frequency: "TWICE_DAILY",
      duration_days: 5,
    });
    assert.equal(ok.medication, "Amoxicillin");
  });
});
