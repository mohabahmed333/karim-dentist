import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { toothGltfKind, toothGltfUrl } from "./toothGltf.ts";

describe("toothGltf", () => {
  it("maps chart kinds onto shared GLB templates", () => {
    assert.equal(toothGltfKind("central"), "incisor");
    assert.equal(toothGltfKind("lateral"), "incisor");
    assert.equal(toothGltfKind("canine"), "canine");
    assert.equal(toothGltfKind("premolar"), "premolar");
    assert.equal(toothGltfKind("molar"), "molar");
  });

  it("builds public URLs under /dental/teeth", () => {
    assert.match(toothGltfUrl("molar"), /^\/dental\/teeth\/molar\.glb\?v=/);
  });
});
