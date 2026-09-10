import assert from "node:assert/strict";
import test from "node:test";
import {
  buildShowreelBookingSlots,
  ensureOpenBookingSlots,
} from "./buildShowreelBookingSlots.ts";

test("showreel booking slots include open times", () => {
  const slots = buildShowreelBookingSlots(new Date("2026-09-09T12:00:00Z"));
  assert.ok(slots.length >= 8);
  assert.ok(slots.every((s) => s.status === "open"));
});

test("ensureOpenBookingSlots replaces all-full API days", () => {
  const full = [
    {
      id: "a",
      starts_at: "2026-09-10T10:00:00.000Z",
      ends_at: "2026-09-10T11:00:00.000Z",
      status: "booked" as const,
    },
  ];
  const next = ensureOpenBookingSlots(full);
  assert.ok(next.some((s) => s.status === "open"));
});
