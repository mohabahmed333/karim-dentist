import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SHOWREEL_AI_BOOKING_CURSOR_STEPS,
  SHOWREEL_CLINICAL_CURSOR_STEPS,
  SHOWREEL_DASHBOARD_CURSOR_STEPS,
  SHOWREEL_SMART_UX_CURSOR_STEPS,
  SHOWREEL_WHATSAPP_CURSOR_STEPS,
  type ShowreelCursorStep,
} from "./showreelCursorTimeline.ts";
import { SHOWREEL_SITE_TO_CHAT_CURSOR_STEPS } from "./showreelSiteToChatTimeline.ts";
import { SHOWREEL_SLIDES } from "../showreelSlides.ts";

const TIMELINES: Record<string, ShowreelCursorStep[]> = {
  dashboard: SHOWREEL_DASHBOARD_CURSOR_STEPS,
  "smart-ux": SHOWREEL_SMART_UX_CURSOR_STEPS,
  "clinical-ai": SHOWREEL_CLINICAL_CURSOR_STEPS,
  whatsapp: SHOWREEL_WHATSAPP_CURSOR_STEPS,
  "ai-booking": SHOWREEL_AI_BOOKING_CURSOR_STEPS,
  "site-to-chat": SHOWREEL_SITE_TO_CHAT_CURSOR_STEPS,
};

function lastAt(steps: ShowreelCursorStep[]): number {
  return steps.reduce((max, step) => Math.max(max, step.at), 0);
}

describe("showreel timeline integrity", () => {
  for (const [productScene, steps] of Object.entries(TIMELINES)) {
    it(`${productScene}: slide durationMs outlasts its last cursor step`, () => {
      const slide = SHOWREEL_SLIDES.find(
        (s) => s.kind === "feature" && s.productScene === productScene,
      );
      assert.ok(slide, `no slide wired to productScene "${productScene}"`);
      assert.ok(
        slide!.durationMs > lastAt(steps),
        `${productScene}: durationMs ${slide!.durationMs} does not clear ` +
          `last step at ${lastAt(steps)}`,
      );
    });

    it(`${productScene}: every beat label is non-empty`, () => {
      for (const step of steps) {
        if (step.beat !== undefined) {
          assert.ok(
            step.beat.trim().length > 0,
            `${productScene}:${step.id} has an empty beat label`,
          );
        }
      }
    });

    it(`${productScene}: typeMs only appears on a text-carrying dispatch`, () => {
      for (const step of steps) {
        if (step.typeMs === undefined) continue;
        const detail = step.dispatch?.detail as { text?: unknown } | undefined;
        assert.equal(
          typeof detail?.text,
          "string",
          `${productScene}:${step.id} sets typeMs without dispatch.detail.text`,
        );
      }
    });
  }
});
