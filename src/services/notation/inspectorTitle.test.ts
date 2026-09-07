import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { chartInspectorTitle } from "./inspectorTitle.ts";

describe("chartInspectorTitle", () => {
  it("formats FDI 34 as Tooth #34 with a title-case name", () => {
    assert.equal(
      chartInspectorTitle("34", "fdi"),
      "Tooth #34 • Lower Left First Premolar",
    );
  });
});
