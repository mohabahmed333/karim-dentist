import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { parseChartingFee } from "./parseFee.ts";

describe("parseChartingFee", () => {
  it("accepts whole EGP integers including zero", () => {
    assert.equal(parseChartingFee("0"), 0);
    assert.equal(parseChartingFee("6500"), 6500);
    assert.equal(parseChartingFee(" 1200 "), 1200);
  });

  it("rejects empty, decimals, and negatives", () => {
    assert.equal(parseChartingFee(""), null);
    assert.equal(parseChartingFee("  "), null);
    assert.equal(parseChartingFee("65.5"), null);
    assert.equal(parseChartingFee("-1"), null);
    assert.equal(parseChartingFee("1e3"), null);
  });
});
