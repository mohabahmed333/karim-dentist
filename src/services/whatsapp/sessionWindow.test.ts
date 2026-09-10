import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  isWhatsappSessionOpen,
  latestInboundAt,
  laterIsoTimestamp,
} from "./sessionWindow.ts";

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

test("laterIsoTimestamp keeps the newer instant", () => {
  assert.equal(
    laterIsoTimestamp("2026-09-07T17:31:09.000Z", "2026-09-08T19:36:52.000Z"),
    "2026-09-08T19:36:52.000Z",
  );
});

test("latestInboundAt prefers a newer customer message over a stale column", () => {
  const clock = new Date("2026-09-08T20:00:00.000Z");
  const stored = "2026-09-07T17:31:09.000Z";
  const fromThread = latestInboundAt(stored, [
    "2026-09-07T16:00:00.000Z",
    "2026-09-08T19:36:52.000Z",
  ]);
  assert.equal(fromThread, "2026-09-08T19:36:52.000Z");
  assert.equal(isWhatsappSessionOpen(fromThread, clock), true);
  assert.equal(isWhatsappSessionOpen(stored, clock), false);
});
