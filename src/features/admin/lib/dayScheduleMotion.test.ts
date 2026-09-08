import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dayScheduleCardContainerVariants,
  dayScheduleCardVariants,
  dayScheduleMotionKey,
  dayScheduleTransition,
  dayScheduleVariants,
} from "./dayScheduleMotion.ts";

describe("dayScheduleMotion", () => {
  it("keys by calendar day", () => {
    assert.equal(dayScheduleMotionKey(new Date(2026, 8, 8)), "2026-09-08");
  });

  it("slides enter/exit by direction", () => {
    const variants = dayScheduleVariants();
    const enter = variants.enter as (dir: number) => { x: string };
    assert.equal(enter(1).x, "22%");
    assert.equal(enter(-1).x, "-22%");
  });

  it("collapses when reduced motion is on", () => {
    assert.equal(dayScheduleTransition(true).duration, 0.01);
  });

  it("staggers appointment cards when motion is allowed", () => {
    const container = dayScheduleCardContainerVariants(false);
    const show = container.show as { transition?: { staggerChildren?: number } };
    assert.ok((show.transition?.staggerChildren ?? 0) > 0);
    const cards = dayScheduleCardVariants(false);
    const hidden = cards.hidden as { opacity: number };
    assert.equal(hidden.opacity, 0);
  });
});
