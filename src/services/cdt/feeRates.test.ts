import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { feeRateFromPct, feeSummary, pctFromFeeRate } from "./feeRates.ts";

describe("fee rate toggles", () => {
  it("maps Standard, Insurance -20%, and Package -10%", () => {
    assert.equal(pctFromFeeRate("standard"), 0);
    assert.equal(pctFromFeeRate("insurance"), 20);
    assert.equal(pctFromFeeRate("package"), 10);
    assert.equal(feeRateFromPct(20), "insurance");
    assert.equal(feeRateFromPct(50), "standard");
  });

  it("shows total, discount, and patient balance on billable rows only", () => {
    const summary = feeSummary(
      [
        { status: "open", fee_amount: 900 },
        { status: "scheduled", fee_amount: 150 },
        { status: "done", fee_amount: 650 },
      ],
      20,
    );
    assert.deepEqual(summary, { totalFee: 1050, discount: 210, balance: 840 });
  });
});
