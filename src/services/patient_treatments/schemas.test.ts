import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { treatmentUpsertSchema } from "./schemas";

describe("patient treatments schemas", () => {
  it("accepts a critical treatment payload", () => {
    const parsed = treatmentUpsertSchema.parse({
      tooth_name: "Upper Canine",
      tooth_fdi: "13",
      severity: "Critical",
      last_treatment: "Root canal two months ago",
      ai_title: "High Risk",
      ai_description: "<p>Elevated perio risk</p>",
      ai_confidence: 75,
      ai_recommendation: "<p>More frequent cleanings</p>",
    });
    assert.equal(parsed.severity, "Critical");
    assert.equal(parsed.tooth_fdi, "13");
  });

  it("accepts CDT code D3330 and primary FDI 74", () => {
    const parsed = treatmentUpsertSchema.parse({
      tooth_name: "Lower left first molar",
      tooth_fdi: "74",
      severity: "Critical",
      cdt_code: "D3330",
      phase: "restorative",
      fee_amount: 6500,
    });
    assert.equal(parsed.cdt_code, "D3330");
    assert.equal(parsed.tooth_fdi, "74");
    assert.equal(parsed.fee_amount, 6500);
  });

  it("rejects CDT without D prefix", () => {
    const parsed = treatmentUpsertSchema.safeParse({
      tooth_name: "Molar",
      tooth_fdi: "36",
      severity: "Minor",
      cdt_code: "3330",
    });
    assert.equal(parsed.success, false);
  });

  it("rejects empty FDI", () => {
    const parsed = treatmentUpsertSchema.safeParse({
      tooth_name: "Lower molar",
      tooth_fdi: "",
      severity: "Minor",
    });
    assert.equal(parsed.success, false);
  });
});
