import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { chipLabelFor } from "./catalog.ts";

describe("chipLabelFor", () => {
  it("prefixes the catalog short name", () => {
    assert.equal(chipLabelFor("D2391"), "+ Fill");
    assert.equal(chipLabelFor("D7140"), "+ Extract");
  });

  it("falls back to the raw code when unknown", () => {
    assert.equal(chipLabelFor("D0000"), "+ D0000");
  });
});
