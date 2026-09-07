import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildGraphNetwork, SOURCE_NODE_ID } from "./graph-network.ts";

describe("graph network model", () => {
  it("builds parent-child edges for endodontic infection", () => {
    const network = buildGraphNetwork("ENDODONTIC_INFECTION", 14, [
      "vitality",
      "perio",
      "culture",
      "bone",
      "cbct",
      "biopsy",
      "note",
      "hospital",
      "tmj",
      "occlusion",
    ]);
    assert.equal(network.source.id, SOURCE_NODE_ID);
    assert.ok(network.source.children.includes("card-pulpectomy"));
    assert.ok(
      network.edges.some(
        (edge) => edge.from === SOURCE_NODE_ID && edge.to === "card-pulpectomy",
      ),
    );
    assert.ok(
      network.edges.some(
        (edge) => edge.from === "card-pulpectomy" && edge.to === "card-cbct",
      ),
    );
    assert.ok(
      network.edges.some(
        (edge) => edge.from === "card-cbct" && edge.to === "card-endo-note",
      ),
    );
  });

  it("prunes cards outside visible anchors", () => {
    const network = buildGraphNetwork("PULPITIS", 12, ["vitality", "cbct"]);
    assert.deepEqual(
      network.cards.map((card) => card.id).sort(),
      ["card-cbct", "card-pulpectomy"],
    );
    assert.equal(network.edges.length, 2);
  });
});
