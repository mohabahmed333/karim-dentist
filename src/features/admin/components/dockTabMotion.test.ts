import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DOCK_TAB_SKELETON_MS,
  dockTabTransition,
  dockTabVariants,
} from "./dockTabMotion.ts";

describe("dockTabMotion", () => {
  it("uses a short skeleton window", () => {
    assert.ok(DOCK_TAB_SKELETON_MS > 100);
    assert.ok(DOCK_TAB_SKELETON_MS < 500);
  });

  it("collapses motion when reduced", () => {
    assert.equal(dockTabTransition(true).duration, 0.01);
    assert.ok((dockTabTransition(false).duration ?? 0) > 0.1);
  });

  it("slides enter/exit by direction", () => {
    const variants = dockTabVariants();
    const enter = variants.enter as (dir: number) => {
      x: string;
      opacity: number;
    };
    const exit = variants.exit as (dir: number) => {
      x: string;
      opacity: number;
    };
    assert.equal(enter(1).x, "28%");
    assert.equal(enter(-1).x, "-28%");
    assert.equal(exit(1).opacity, 0);
  });
});
