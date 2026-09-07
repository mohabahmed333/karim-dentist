import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  displayTooth,
  fdiForUniversalAdult,
  fdiSet,
  universalForFdi,
} from "./index.ts";

describe("charting notation", () => {
  it("lists 32 adult and 20 primary FDI numbers", () => {
    assert.equal(fdiSet("adult").length, 32);
    assert.equal(fdiSet("primary").length, 20);
    assert.ok(fdiSet("adult").includes("11"));
    assert.ok(fdiSet("primary").includes("51"));
    assert.equal(fdiSet("primary").includes("11"), false);
  });

  it("labels upper right central as FDI 11, Universal #8, Palmer 1┘", () => {
    assert.equal(displayTooth("11", "fdi"), "11");
    assert.equal(displayTooth("11", "universal"), "#8");
    assert.equal(displayTooth("11", "palmer"), "1┘");
  });

  it("maps adult Universal and primary letters", () => {
    assert.equal(universalForFdi("11"), 8);
    assert.equal(universalForFdi("55"), "A");
    assert.equal(fdiForUniversalAdult(8), "11");
    assert.equal(universalForFdi("19"), null);
    assert.equal(displayTooth("99", "fdi"), "");
  });
});
