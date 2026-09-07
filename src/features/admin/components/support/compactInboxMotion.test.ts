import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compactPaneTransition,
  compactPaneVariants,
  UNREAD_BADGE_POP_MS,
  unreadBadgePopTransition,
} from "./compactInboxMotion.ts";

describe("compactInboxMotion", () => {
  it("opens thread from the end in LTR", () => {
    const variants = compactPaneVariants(false);
    const enter = variants.enter as (dir: number) => { x: string };
    const exit = variants.exit as (dir: number) => { x: string };
    assert.equal(enter(1).x, "40%");
    assert.equal(exit(1).x, "-28%");
  });

  it("flips slide axis in RTL", () => {
    const variants = compactPaneVariants(true);
    const enter = variants.enter as (dir: number) => { x: string };
    const exit = variants.exit as (dir: number) => { x: string };
    assert.equal(enter(1).x, "-40%");
    assert.equal(exit(1).x, "28%");
  });

  it("collapses duration when reduced motion is on", () => {
    assert.equal(compactPaneTransition(true).duration, 0.01);
    assert.equal(unreadBadgePopTransition(true).duration, 0.01);
    assert.equal(UNREAD_BADGE_POP_MS, 160);
  });
});
