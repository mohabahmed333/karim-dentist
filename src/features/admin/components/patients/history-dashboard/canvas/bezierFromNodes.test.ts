import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildCanvasEdges, cubicEdgePath } from "./bezierFromNodes.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { createInitialScene } from "./initialScene.ts";

describe("canvas node graph geometry", () => {
  it("builds midpoint cubic paths between node anchors", () => {
    const d = cubicEdgePath({ x: 100, y: 50 }, { x: 300, y: 120 });
    assert.equal(d, "M 100.0 50.0 C 200.0 50.0, 200.0 120.0, 300.0 120.0");
  });

  it("derives one edge per parent-child link", () => {
    const nodes = createInitialScene();
    const sizes = Object.fromEntries(
      nodes.map((node) => [node.id, { width: 200, height: 90 }]),
    );
    const edges = buildCanvasEdges(nodes, sizes);
    assert.equal(edges.length, 7);
    assert.ok(edges.some((edge) => edge.id === "node-root->node-metric"));
    assert.ok(edges.some((edge) => edge.id === "node-media->node-stacked"));
  });
});
