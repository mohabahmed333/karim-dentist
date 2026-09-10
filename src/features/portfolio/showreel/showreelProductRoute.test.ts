import assert from "node:assert/strict";
import test from "node:test";
import {
  isShowreelProductScene,
  parseShowreelDemoMode,
  parseShowreelProductScene,
} from "./showreelProductRoute.ts";
import {
  isShowreelProductActivateMessage,
  SHOWREEL_PRODUCT_ACTIVATE,
} from "./showreelProductActivate.ts";

test("parses product demo mode and scene allowlist", () => {
  assert.equal(parseShowreelDemoMode("product"), "product");
  assert.equal(parseShowreelDemoMode("site"), "site");
  assert.equal(parseShowreelDemoMode("nope"), "site");
  assert.equal(isShowreelProductScene("whatsapp"), true);
  assert.equal(isShowreelProductScene("site-to-chat"), true);
  assert.equal(isShowreelProductScene("hack"), false);
  assert.equal(parseShowreelProductScene("clinical-ai"), "clinical-ai");
  assert.equal(parseShowreelProductScene("site-to-chat"), "site-to-chat");
  assert.equal(parseShowreelProductScene("hack"), "ai-booking");
});

test("validates product activation messages", () => {
  assert.equal(
    isShowreelProductActivateMessage({
      type: SHOWREEL_PRODUCT_ACTIVATE,
      scene: "whatsapp",
      active: true,
    }),
    true,
  );
  assert.equal(
    isShowreelProductActivateMessage({ type: "other", scene: "x" }),
    false,
  );
});
