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
import { SHOWREEL_CUSTOMIZE_CURSOR_STEPS } from "../showreelCustomizeCursorTimeline.ts";
import { SHOWREEL_SLIDES } from "../showreelSlides.ts";

const TIMELINES: Record<string, ShowreelCursorStep[]> = {
  dashboard: SHOWREEL_DASHBOARD_CURSOR_STEPS,
  "smart-ux": SHOWREEL_SMART_UX_CURSOR_STEPS,
  "clinical-ai": SHOWREEL_CLINICAL_CURSOR_STEPS,
  whatsapp: SHOWREEL_WHATSAPP_CURSOR_STEPS,
  "ai-booking": SHOWREEL_AI_BOOKING_CURSOR_STEPS,
  "site-to-chat": SHOWREEL_SITE_TO_CHAT_CURSOR_STEPS,
  // Not a real productScene (it's identified by customizeScript/URL
  // instead) — findSlide below falls back to matching by id for this one.
  customize: SHOWREEL_CUSTOMIZE_CURSOR_STEPS,
};

function findSlide(productScene: string) {
  return SHOWREEL_SLIDES.find(
    (s) =>
      s.kind === "feature" &&
      (s.productScene === productScene || s.id === productScene),
  );
}

/** Breathing room allowed after the last step before the deck moves on. */
const MAX_TAIL_MS = 3500;

function lastAt(steps: ShowreelCursorStep[]): number {
  return steps.reduce((max, step) => Math.max(max, step.at), 0);
}

describe("showreel timeline integrity", () => {
  for (const [productScene, steps] of Object.entries(TIMELINES)) {
    it(`${productScene}: slide durationMs outlasts its last cursor step`, () => {
      const slide = findSlide(productScene);
      assert.ok(slide, `no slide wired to productScene "${productScene}"`);
      assert.ok(
        slide!.durationMs > lastAt(steps),
        `${productScene}: durationMs ${slide!.durationMs} does not clear ` +
          `last step at ${lastAt(steps)}`,
      );
    });

    it(`${productScene}: does not idle long after its last cursor step`, () => {
      // The deck advances on durationMs alone, so anything past the last step
      // is dead air the viewer sits through with nothing happening.
      const slide = findSlide(productScene);
      const tail = slide!.durationMs - lastAt(steps);
      assert.ok(
        tail <= MAX_TAIL_MS,
        `${productScene}: ${tail}ms of dead air after the last step ` +
          `(durationMs ${slide!.durationMs}, last step ${lastAt(steps)}) ` +
          `— trim durationMs to at most ${lastAt(steps) + MAX_TAIL_MS}`,
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

    it(`${productScene}: every scripted drag is grabbed then released`, () => {
      let carrying: string | null = null;
      for (const step of steps) {
        if (step.dragGrab) {
          assert.equal(
            carrying,
            null,
            `${productScene}:${step.id} grabs while ${carrying} is still held`,
          );
          assert.ok(
            step.selector,
            `${productScene}:${step.id} sets dragGrab without a selector`,
          );
          carrying = step.id;
        }
        if (step.dragAim || step.dragDrop) {
          assert.ok(
            carrying,
            `${productScene}:${step.id} aims/drops with nothing carried`,
          );
          assert.ok(
            step.selector,
            `${productScene}:${step.id} needs a drop target selector`,
          );
        }
        if (step.dragDrop) carrying = null;
      }
      assert.equal(
        carrying,
        null,
        `${productScene}: ${carrying} is never dropped`,
      );
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
