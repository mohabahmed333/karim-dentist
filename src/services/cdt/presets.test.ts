import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { TREATMENT_PRESETS } from "./presets.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { careBucketFor } from "./careBucket.ts";

describe("treatment presets", () => {
  it("exposes four chairside chips with whole-EGP fees", () => {
    const byId = Object.fromEntries(
      TREATMENT_PRESETS.map((row) => [row.id, row]),
    );
    assert.equal(TREATMENT_PRESETS.length, 4);
    assert.equal(byId.fill.code, "D2391");
    assert.equal(byId.fill.fee, 150);
    assert.equal(byId.crown.code, "D2740");
    assert.equal(byId.crown.fee, 900);
    assert.equal(byId.endo.code, "D3330");
    assert.equal(byId.endo.fee, 650);
    assert.equal(byId.extract.code, "D7140");
    assert.equal(byId.extract.fee, 200);
  });

  it("auto-assigns Fill and Crown to Planned, Root Canal and Extract to Immediate", () => {
    const byId = Object.fromEntries(
      TREATMENT_PRESETS.map((row) => [row.id, row]),
    );
    assert.equal(careBucketFor({ cdtCode: byId.fill.code }), "planned");
    assert.equal(careBucketFor({ cdtCode: byId.crown.code }), "planned");
    assert.equal(careBucketFor({ cdtCode: byId.endo.code }), "immediate");
    assert.equal(careBucketFor({ cdtCode: byId.extract.code }), "immediate");
  });
});
