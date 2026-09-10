import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assignArchUniversals,
  centeredArchSlots,
} from "./assignArchUniversals.ts";

describe("assignArchUniversals", () => {
  it("centers 14 lower slots by dropping wisdoms", () => {
    assert.deepEqual(
      centeredArchSlots(
        [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32],
        14,
      ),
      [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
    );
  });

  it("gives every tooth a unique universal (no neighbor collisions)", () => {
    const teeth = [
      { id: "u-r", x: -2, y: 0.5, z: 0 },
      { id: "u-mid-r", x: -0.3, y: 0.5, z: 1 },
      { id: "u-mid-l", x: 0.3, y: 0.5, z: 1 },
      { id: "u-l", x: 2, y: 0.5, z: 0 },
      { id: "l-l", x: 2, y: -0.5, z: 0 },
      { id: "l-mid-l", x: 0.3, y: -0.5, z: 1 },
      { id: "l-mid-r", x: -0.3, y: -0.5, z: 1 },
      { id: "l-r", x: -2, y: -0.5, z: 0 },
    ];
    const map = assignArchUniversals(teeth);
    const values = [...map.values()];
    assert.equal(map.size, 8);
    assert.equal(new Set(values).size, 8);
    assert.ok((map.get("u-r") as number) < (map.get("u-l") as number));
    assert.ok((map.get("l-l") as number) < (map.get("l-r") as number));
  });

  it("uses explicit arch when y doesn't separate upper/lower (e.g. arch.glb)", () => {
    // All y > 0, like the real asset — the y-sign heuristic alone would put
    // every tooth in the "upper" bucket.
    const teeth = [
      { id: "u-r", x: -2, y: 1.5, z: 0, arch: "upper" as const },
      { id: "u-l", x: 2, y: 1.5, z: 0, arch: "upper" as const },
      { id: "l-r", x: -2, y: 0.9, z: 0, arch: "lower" as const },
      { id: "l-l", x: 2, y: 0.9, z: 0, arch: "lower" as const },
    ];
    const map = assignArchUniversals(teeth);
    assert.equal(map.size, 4);
    assert.ok((map.get("u-r") as number) <= 16);
    assert.ok((map.get("u-l") as number) <= 16);
    assert.ok((map.get("l-r") as number) >= 17);
    assert.ok((map.get("l-l") as number) >= 17);
  });
});
