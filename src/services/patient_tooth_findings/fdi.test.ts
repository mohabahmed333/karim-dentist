import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  FDI_NUMBERS,
  LOWER_LEFT,
  LOWER_RIGHT,
  UPPER_LEFT,
  UPPER_RIGHT,
  adjacentFdi,
  isFdiNumber,
  toothName,
  toothType,
  toothVisualState,
} from "./fdi.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { odontogramPositions } from "./fdiLayout.ts";

describe("FDI odontogram", () => {
  it("lists 32 adult FDI numbers in four quadrants", () => {
    assert.deepEqual(UPPER_RIGHT, ["18", "17", "16", "15", "14", "13", "12", "11"]);
    assert.deepEqual(UPPER_LEFT, ["21", "22", "23", "24", "25", "26", "27", "28"]);
    assert.deepEqual(LOWER_LEFT, ["31", "32", "33", "34", "35", "36", "37", "38"]);
    assert.deepEqual(LOWER_RIGHT, ["48", "47", "46", "45", "44", "43", "42", "41"]);
    assert.equal(FDI_NUMBERS.length, 32);
  });

  it("names teeth and maps types", () => {
    assert.equal(toothName("16"), "Upper right first molar");
    assert.equal(toothName("22"), "Upper left lateral incisor");
    assert.equal(toothName("41"), "Lower right central incisor");
    assert.equal(toothType("11"), "central");
    assert.equal(toothType("23"), "canine");
    assert.equal(toothType("35"), "premolar");
    assert.equal(toothType("48"), "molar");
    assert.equal(isFdiNumber("16"), true);
    assert.equal(isFdiNumber("19"), false);
  });

  it("treats selected as active even when a comment exists", () => {
    const commented = new Set(["18", "21"]);
    assert.equal(toothVisualState("18", "22", commented), "has-comment");
    assert.equal(toothVisualState("22", "22", commented), "active");
    assert.equal(toothVisualState("21", "21", commented), "active");
    assert.equal(toothVisualState("11", "22", commented), "unmarked");
  });

  it("places each tooth at a unique SVG coordinate", () => {
    const positions = odontogramPositions();
    assert.equal(Object.keys(positions).length, 32);
    const keys = new Set(
      Object.values(positions).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
    );
    assert.equal(keys.size, 32);
    assert.ok(positions["18"].x < positions["11"].x);
    assert.ok(positions["11"].x < positions["21"].x);
    assert.ok(positions["18"].y < positions["48"].y);
  });

  it("steps through adjacent FDI numbers in chart order", () => {
    assert.equal(adjacentFdi("18", "next"), "17");
    assert.equal(adjacentFdi("11", "next"), "21");
    assert.equal(adjacentFdi("28", "next"), "31");
    assert.equal(adjacentFdi("41", "next"), "18");
    assert.equal(adjacentFdi("48", "prev"), "38");
    assert.equal(adjacentFdi("18", "prev"), "41");
  });
});
