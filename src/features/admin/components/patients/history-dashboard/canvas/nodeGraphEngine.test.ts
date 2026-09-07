import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { addChildNode, autoLayoutTree, deleteNode, disconnectLink } from "./nodeGraphEngine.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { createInitialScene } from "./initialScene.ts";

describe("scene editor graph engine", () => {
  it("adds a child node and links it to the parent", () => {
    const nodes = createInitialScene();
    const next = addChildNode(nodes, {
      parentId: "node-root",
      shapeType: "SHAPE_05",
      title: "New Pill",
    });
    const parent = next.find((node) => node.id === "node-root");
    const child = next.find((node) => node.parentId === "node-root" && node.title === "New Pill");
    assert.ok(parent?.childrenIds.includes(child?.id ?? ""));
    assert.ok(child);
    assert.ok((child?.x ?? 0) > 300);
  });

  it("deletes a node subtree and cleans parent links", () => {
    const nodes = createInitialScene();
    const next = deleteNode(nodes, "node-culture");
    assert.ok(!next.some((node) => node.id === "node-culture"));
    assert.ok(!next.some((node) => node.id === "node-biopsy"));
    const root = next.find((node) => node.id === "node-root");
    assert.ok(!root?.childrenIds.includes("node-culture"));
  });

  it("disconnects a child without deleting it", () => {
    const nodes = createInitialScene();
    const next = disconnectLink(nodes, "node-perio");
    const perio = next.find((node) => node.id === "node-perio");
    assert.equal(perio?.parentId, null);
    const root = next.find((node) => node.id === "node-root");
    assert.ok(!root?.childrenIds.includes("node-perio"));
  });

  it("auto-layout arranges nodes into column tiers", () => {
    const laidOut = autoLayoutTree(createInitialScene());
    const media = laidOut.find((node) => node.id === "node-media");
    assert.ok((media?.x ?? 0) > 600);
  });
});
