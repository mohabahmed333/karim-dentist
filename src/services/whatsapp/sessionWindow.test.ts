import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { isWhatsappSessionOpen } from "./sessionWindow.ts";

const now = new Date("2026-09-08T12:00:00.000Z");

test("isWhatsappSessionOpen is closed when lastInboundAt is null", () => {
  assert.equal(isWhatsappSessionOpen(null, now), false);
});

test("isWhatsappSessionOpen is open just under 24 hours", () => {
  const at = new Date(now.getTime() - (24 * 60 * 60 * 1000 - 60_000));
  assert.equal(isWhatsappSessionOpen(at.toISOString(), now), true);
});

test("isWhatsappSessionOpen is closed just over 24 hours", () => {
  const at = new Date(now.getTime() - (24 * 60 * 60 * 1000 + 60_000));
  assert.equal(isWhatsappSessionOpen(at.toISOString(), now), false);
});

test("isWhatsappSessionOpen is closed at exactly 24 hours", () => {
  const at = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  assert.equal(isWhatsappSessionOpen(at.toISOString(), now), false);
});
