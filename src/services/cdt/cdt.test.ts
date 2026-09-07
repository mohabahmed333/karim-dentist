import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { CDT_CATALOG, defaultPhaseForCdt, planTotals } from "./index.ts";

describe("CDT catalog and fees", () => {
  it("keeps unique codes and maps families to phases", () => {
    const codes = CDT_CATALOG.map((row) => row.code);
    assert.equal(new Set(codes).size, codes.length);
    for (const row of CDT_CATALOG) {
      assert.equal("defaultFee" in row, false);
      assert.match(row.code, /^D[0-9]{4}$/);
      assert.ok(row.shortLabel.trim().length > 0);
      assert.ok(row.group.length > 0);
    }
    assert.ok(CDT_CATALOG.length >= 30);
    assert.equal(defaultPhaseForCdt("D3330"), "urgent");
    assert.equal(defaultPhaseForCdt("D2391"), "restorative");
    assert.equal(defaultPhaseForCdt("D7140"), "urgent");
    assert.equal(defaultPhaseForCdt("D6010"), "prosthodontic");
    assert.equal(defaultPhaseForCdt("D9944"), "prosthodontic");
  });

  it("sums open and scheduled fees and excludes done", () => {
    const totals = planTotals(
      [
        { status: "open", fee_amount: 6500 },
        { status: "scheduled", fee_amount: 8000 },
        { status: "done", fee_amount: 9000 },
      ],
      50,
    );
    assert.deepEqual(totals, { gross: 14500, insurance: 7250, oop: 7250 });
  });
});
