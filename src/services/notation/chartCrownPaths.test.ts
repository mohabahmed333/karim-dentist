import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CHART_CROWN_PATHS, CHART_CROWN_WIDTH } from "./chartCrownPaths";

describe("chartCrownPaths", () => {
  it("defines a distinct path and width for every crown kind", () => {
    const kinds = ["central", "lateral", "canine", "premolar", "molar"] as const;
    const paths = new Set(kinds.map((k) => CHART_CROWN_PATHS[k]));
    assert.equal(paths.size, 5);
    assert.equal(CHART_CROWN_WIDTH.molar, "w-8");
    assert.equal(CHART_CROWN_WIDTH.lateral, "w-5");
  });
});
