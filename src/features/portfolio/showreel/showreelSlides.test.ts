import assert from "node:assert/strict";
import test from "node:test";
import {
  areShowreelDevicesReady,
  getShowreelDeviceIds,
} from "./showreelSlideHelpers.ts";
import { SHOWREEL_SLIDES } from "./showreelSlideData.ts";

test("tracks every desktop and mobile device before playback", () => {
  const ids = getShowreelDeviceIds(SHOWREEL_SLIDES);

  assert.deepEqual(ids, [
    "site:desktop",
    "site:mobile",
    "hero-cms:desktop",
    "case-edit-cms:desktop",
    "order-cms:desktop",
  ]);
  assert.equal(areShowreelDevicesReady(ids, new Set(ids.slice(0, -1))), false);
  assert.equal(areShowreelDevicesReady(ids, new Set(ids)), true);
});

test("includes scripted case-title and homepage-order customize slides", () => {
  const caseEdit = SHOWREEL_SLIDES.find((slide) => slide.id === "case-edit-cms");
  const order = SHOWREEL_SLIDES.find((slide) => slide.id === "order-cms");

  assert.ok(caseEdit && caseEdit.kind === "feature");
  assert.equal(caseEdit.customizeScript, "case-title");
  assert.match(caseEdit.desktopSrc, /item=first/);
  assert.match(caseEdit.desktopSrc, /focus=title/);

  assert.ok(order && order.kind === "feature");
  assert.equal(order.customizeScript, "homepage-order");
  assert.match(order.desktopSrc, /section=settings/);
  assert.match(order.desktopSrc, /view=order/);
});
