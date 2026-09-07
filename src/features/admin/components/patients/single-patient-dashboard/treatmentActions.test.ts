import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { appendQuickTreatment, toothConditionTint } from "./treatmentActions.ts";

describe("appendQuickTreatment", () => {
  it("appends fill for selected tooth and keeps prior rows", () => {
    const next = appendQuickTreatment([], 14, "Fill");
    assert.equal(next.length, 1);
    assert.equal(next[0]?.tooth, 14);
    assert.match(next[0]?.procedureName ?? "", /composite|fill/i);
    assert.ok(next[0]?.cdtCode);
  });
});

describe("toothConditionTint", () => {
  it("returns Critical when any treatment on tooth is Critical", () => {
    const tint = toothConditionTint(
      [
        {
          id: "a",
          tooth: 19,
          cdtCode: "D2740",
          procedureName: "Crown",
          severity: "Critical",
          fee: 1200,
        },
      ],
      19,
    );
    assert.equal(tint, "Critical");
  });
});
