import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as THREE from "three";
import { paintArchSelection } from "./paintArchSelection.ts";

const CROWN = new THREE.Color("#FFFEF8");

function meshWithFdi(fdi: string): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshPhysicalMaterial({ color: "#000000" }),
  );
  mesh.userData.archFdi = fdi;
  return mesh;
}

function targetOf(mesh: THREE.Mesh): THREE.Color {
  const mat = mesh.material as THREE.MeshPhysicalMaterial;
  return mat.userData.archTargetColor as THREE.Color;
}

describe("paintArchSelection", () => {
  it("tints the selected tooth toward highlightColor", () => {
    const selected = meshWithFdi("11");
    const root = new THREE.Group();
    root.add(selected);

    paintArchSelection(root, "11", {
      focusMode: true,
      highlightColor: "#2563eb",
      markedColor: "#f59e0b",
      markedFdis: [],
    });

    const expected = new THREE.Color("#2563eb").lerp(CROWN, 0.45);
    assert.ok(targetOf(selected).equals(expected));
  });

  it("tints a marked-but-unselected tooth with markedColor, distinct from the selected tooth's color", () => {
    const selected = meshWithFdi("11");
    const marked = meshWithFdi("12");
    const root = new THREE.Group();
    root.add(selected, marked);

    paintArchSelection(root, "11", {
      focusMode: true,
      highlightColor: "#2563eb",
      markedColor: "#f59e0b",
      markedFdis: ["12"],
    });

    const expectedMarked = new THREE.Color("#f59e0b").lerp(CROWN, 0.6);
    assert.ok(targetOf(marked).equals(expectedMarked));
    assert.ok(!targetOf(marked).equals(targetOf(selected)));
  });

  it("a tooth that is both selected and marked reads as selected, not marked", () => {
    const both = meshWithFdi("11");
    const root = new THREE.Group();
    root.add(both);

    paintArchSelection(root, "11", {
      focusMode: true,
      highlightColor: "#2563eb",
      markedColor: "#f59e0b",
      markedFdis: ["11"],
    });

    const expectedSelected = new THREE.Color("#2563eb").lerp(CROWN, 0.45);
    assert.ok(targetOf(both).equals(expectedSelected));
  });

  it("leaves untouched teeth at clinical white", () => {
    const untouched = meshWithFdi("21");
    const root = new THREE.Group();
    root.add(untouched);

    paintArchSelection(root, "11", {
      focusMode: true,
      highlightColor: "#2563eb",
      markedColor: "#f59e0b",
      markedFdis: [],
    });

    assert.ok(targetOf(untouched).equals(CROWN));
  });

  it("falls back to highlightColor when markedColor is omitted", () => {
    const marked = meshWithFdi("12");
    const root = new THREE.Group();
    root.add(marked);

    paintArchSelection(root, null, {
      focusMode: true,
      highlightColor: "#2563eb",
      markedFdis: ["12"],
    });

    const expected = new THREE.Color("#2563eb").lerp(CROWN, 0.6);
    assert.ok(targetOf(marked).equals(expected));
  });
});
