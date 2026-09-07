import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { cdtAddBlocked } from "./addReady.ts";

describe("cdtAddBlocked", () => {
  it("asks for a tooth before anything else", () => {
    assert.equal(
      cdtAddBlocked({ hasTooth: false, code: "D3330", fee: "9000" }),
      "Click a tooth on the chart",
    );
  });

  it("asks for a CDT code when a tooth is selected", () => {
    assert.equal(
      cdtAddBlocked({ hasTooth: true, code: "", fee: "9000" }),
      "Pick a CDT procedure",
    );
  });

  it("asks for a whole EGP fee after the procedure", () => {
    assert.equal(
      cdtAddBlocked({ hasTooth: true, code: "D3330", fee: "" }),
      "Type the fee in whole EGP",
    );
  });

  it("returns null when tooth, code, and fee are ready", () => {
    assert.equal(
      cdtAddBlocked({ hasTooth: true, code: "D3330", fee: "9000" }),
      null,
    );
  });
});
