import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { dataFromForm, formFromShape } from "./shapeForm.ts";

describe("shape form builder", () => {
  it("maps pill fields to node data", () => {
    const form = formFromShape("SHAPE_05");
    const data = dataFromForm("SHAPE_05", { ...form, date: "12.10", title: "Canal Culture" });
    assert.equal(data.date, "12.10");
  });

  it("maps lab progress to node data", () => {
    const form = formFromShape("SHAPE_07");
    const data = dataFromForm("SHAPE_07", { ...form, progressPercent: "91" });
    assert.equal(data.progressPercent, 91);
  });

  it("maps rx list to drugs array", () => {
    const form = formFromShape("SHAPE_08");
    const data = dataFromForm("SHAPE_08", {
      ...form,
      drug1: "Chlorhexidine 0.12%",
      drug1Timing: "night",
    });
    assert.equal(data.drugs?.[0]?.name, "Chlorhexidine 0.12%");
    assert.equal(data.drugs?.[0]?.timing, "night");
  });
});
