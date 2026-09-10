import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  SHOWREEL_TITLE_CARD_MS,
  isFeatureDemoLive,
  isFeatureTitleCardVisible,
} from "./showreelTitleCard.ts";

test("title card lasts about 1.8s", () => {
  assert.equal(SHOWREEL_TITLE_CARD_MS, 1800);
});

test("title card holds while active before play, then for the card duration", () => {
  assert.equal(isFeatureTitleCardVisible(true, false, 0), true);
  assert.equal(isFeatureTitleCardVisible(true, true, 0), true);
  assert.equal(isFeatureTitleCardVisible(true, true, 1799), true);
  assert.equal(isFeatureTitleCardVisible(true, true, 1800), false);
  assert.equal(isFeatureTitleCardVisible(false, true, 0), false);
});

test("demo scripts only run after the title card", () => {
  assert.equal(isFeatureDemoLive(true, true, false), false);
  assert.equal(isFeatureDemoLive(true, true, true), true);
  assert.equal(isFeatureDemoLive(false, true, true), false);
  assert.equal(isFeatureDemoLive(true, false, true), false);
});
