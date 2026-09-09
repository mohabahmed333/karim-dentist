import assert from "node:assert/strict";
import test from "node:test";
import {
  areShowreelDevicesReady,
  getShowreelDeviceIds,
} from "./showreelSlideHelpers.ts";
import { SHOWREEL_SLIDES } from "./showreelSlideData.ts";

test("dental showreel order and approximate runtime", () => {
  const ids = SHOWREEL_SLIDES.map((s) => s.id);
  assert.deepEqual(ids, [
    "intro",
    "site",
    "site-to-chat",
    "ai-booking",
    "whatsapp",
    "clinical-ai",
    "smart-ux",
    "dashboard",
    "customize",
    "outro",
  ]);
  const totalMs = SHOWREEL_SLIDES.reduce((sum, s) => sum + s.durationMs, 0);
  // Upper bound covers site-to-chat's Nour/Youssef/Mariam thread browsing
  // and ai-booking's staff follow-up turn (typed reply + AI ack).
  assert.ok(totalMs >= 110_000 && totalMs <= 180_000, `runtime ${totalMs}`);
});

test("AI scenes require human review flags", () => {
  for (const id of ["ai-booking", "clinical-ai"] as const) {
    const slide = SHOWREEL_SLIDES.find((s) => s.id === id);
    assert.ok(slide && slide.kind === "feature");
    assert.equal(slide.requiresAiReview, true);
    assert.ok(slide.productScene);
  }
});

test("tracks devices before playback for site + product + customize", () => {
  const ids = getShowreelDeviceIds(SHOWREEL_SLIDES);
  assert.ok(ids.includes("site:desktop"));
  // The public-site scene is the real-app scrolling demo and is desktop/web
  // only — it should never track a mobile device.
  assert.ok(!ids.includes("site:mobile"));
  assert.ok(ids.includes("site-to-chat:desktop"));
  assert.ok(ids.includes("ai-booking:desktop"));
  assert.ok(ids.includes("customize:desktop"));
  assert.equal(areShowreelDevicesReady(ids, new Set(ids.slice(0, -1))), false);
  assert.equal(areShowreelDevicesReady(ids, new Set(ids)), true);
});

test("customize slide stays English (no locale flip)", () => {
  const slide = SHOWREEL_SLIDES.find((s) => s.id === "customize");
  assert.ok(slide && slide.kind === "feature");
  assert.equal(slide.customizeScript, "translate-all");
  assert.match(slide.body, /English stays/i);
});
