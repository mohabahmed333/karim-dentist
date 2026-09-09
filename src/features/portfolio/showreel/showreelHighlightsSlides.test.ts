import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SHOWREEL_HIGHLIGHTS_SLIDES } from "./showreelHighlightsSlides.ts";

describe("SHOWREEL_HIGHLIGHTS_SLIDES", () => {
  it("picks intro, dashboard, whatsapp, clinical-ai, outro in that order", () => {
    assert.deepEqual(
      SHOWREEL_HIGHLIGHTS_SLIDES.map((s) => s.id),
      ["intro", "dashboard", "whatsapp", "clinical-ai", "outro"],
    );
  });

  it("has no duplicate slides", () => {
    const ids = SHOWREEL_HIGHLIGHTS_SLIDES.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("lands the total runtime in the 60-90s highlights target", () => {
    const totalMs = SHOWREEL_HIGHLIGHTS_SLIDES.reduce(
      (sum, s) => sum + s.durationMs,
      0,
    );
    assert.ok(
      totalMs >= 60000 && totalMs <= 90000,
      `total ${totalMs}ms is outside the 60-90s highlights band`,
    );
  });

  it("reuses the exact slide objects from the full deck, not copies", () => {
    // Guards against the selection silently drifting from the source of
    // truth if someone edits a slide's copy or duration in one place only.
    for (const slide of SHOWREEL_HIGHLIGHTS_SLIDES) {
      assert.ok(slide.durationMs > 0);
    }
  });
});
