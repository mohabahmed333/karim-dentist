import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { resolveChairsidePresets } from "./resolvePresets.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { TREATMENT_PRESETS } from "../cdt/presets.ts";

describe("resolveChairsidePresets", () => {
  it("falls back to hardcoded presets when clinic rows are empty", () => {
    const rows = resolveChairsidePresets([], []);
    assert.deepEqual(rows, [...TREATMENT_PRESETS]);
  });

  it("joins preset slots to schedule fees and sorts by slot", () => {
    const rows = resolveChairsidePresets(
      [
        { slot: 2, code: "D2740", label: "+ Crown" },
        { slot: 1, code: "D2391", label: "+ Fill" },
      ],
      [
        { code: "D2391", fee_egp: 175 },
        { code: "D2740", fee_egp: 950 },
      ],
    );
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.id, "slot-1");
    assert.equal(rows[0]?.code, "D2391");
    assert.equal(rows[0]?.fee, 175);
    assert.equal(rows[1]?.fee, 950);
  });

  it("uses fee 0 when a preset code is missing from the schedule", () => {
    const rows = resolveChairsidePresets(
      [{ slot: 1, code: "D2391", label: "+ Fill" }],
      [],
    );
    assert.equal(rows[0]?.fee, 0);
  });
});
