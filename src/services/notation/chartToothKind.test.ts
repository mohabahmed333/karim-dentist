import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chartToothKind } from "./chartToothKind";

describe("chartToothKind", () => {
  it("maps adult FDI to crown silhouette kinds", () => {
    assert.equal(chartToothKind("11"), "central");
    assert.equal(chartToothKind("12"), "lateral");
    assert.equal(chartToothKind("23"), "canine");
    assert.equal(chartToothKind("34"), "premolar");
    assert.equal(chartToothKind("45"), "premolar");
    assert.equal(chartToothKind("16"), "molar");
    assert.equal(chartToothKind("48"), "molar");
  });

  it("maps primary FDI molars (no premolars)", () => {
    assert.equal(chartToothKind("51"), "central");
    assert.equal(chartToothKind("62"), "lateral");
    assert.equal(chartToothKind("73"), "canine");
    assert.equal(chartToothKind("54"), "molar");
    assert.equal(chartToothKind("85"), "molar");
  });
});
