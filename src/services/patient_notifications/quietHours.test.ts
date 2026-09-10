import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { isQuietHour, localHourIn, nextSendableAt } from "./quietHours.ts";

const CAIRO = { start: 22, end: 9, timeZone: "Africa/Cairo" };
const hourIn = (d: Date) => localHourIn(d, "Africa/Cairo");

describe("isQuietHour", () => {
  it("covers a window that crosses midnight", () => {
    for (const h of [22, 23, 0, 3, 8]) {
      assert.equal(isQuietHour(h, 22, 9), true, `${h}:00 should be quiet`);
    }
    for (const h of [9, 12, 21]) {
      assert.equal(isQuietHour(h, 22, 9), false, `${h}:00 should be sendable`);
    }
  });

  it("covers a window inside one day", () => {
    assert.equal(isQuietHour(13, 12, 15), true);
    assert.equal(isQuietHour(15, 12, 15), false);
  });

  it("treats start === end as quiet hours disabled, not as always quiet", () => {
    // Otherwise a misconfiguration would silently stop every notification.
    assert.equal(isQuietHour(3, 0, 0), false);
  });
});

describe("nextSendableAt", () => {
  it("passes through a time that is already sendable", () => {
    // 12:00 Cairo in summer (UTC+3).
    const at = new Date("2026-07-15T09:00:00Z");
    assert.equal(nextSendableAt(at, CAIRO).getTime(), at.getTime());
  });

  it("holds a late-evening send until the next morning", () => {
    // 22:30 Cairo, summer.
    const out = nextSendableAt(new Date("2026-07-15T19:30:00Z"), CAIRO);
    assert.equal(hourIn(out), 9);
    assert.equal(out.getTime() > Date.parse("2026-07-15T19:30:00Z"), true);
    // Lands on the top of the hour, so the morning batch is not staggered.
    assert.match(out.toISOString(), /:00:00\.000Z$/);
  });

  it("releases an early-morning send at opening time the same day", () => {
    // 06:00 Cairo, summer -> 09:00 the same morning, three hours later.
    const at = new Date("2026-07-15T03:00:00Z");
    const out = nextSendableAt(at, CAIRO);
    assert.equal(hourIn(out), 9);
    assert.equal(out.getTime() - at.getTime(), 3 * 3_600_000);
  });

  it("is exact on both edges of the window", () => {
    // 21:59 Cairo sends; 22:00 does not.
    const before = new Date("2026-07-15T18:59:00Z");
    assert.equal(nextSendableAt(before, CAIRO).getTime(), before.getTime());
    const at22 = new Date("2026-07-15T19:00:00Z");
    assert.equal(nextSendableAt(at22, CAIRO).getTime() > at22.getTime(), true);
    // 09:00 is sendable — `end` is exclusive.
    const at9 = new Date("2026-07-15T06:00:00Z");
    assert.equal(nextSendableAt(at9, CAIRO).getTime(), at9.getTime());
  });

  it("uses the calendar across a DST change, not a fixed offset", () => {
    // Cairo is UTC+2 in winter: 23:00 local on 15 January.
    const winter = new Date("2026-01-15T21:00:00Z");
    assert.equal(hourIn(winter), 23, "precondition: winter is UTC+2");
    const out = nextSendableAt(winter, CAIRO);
    assert.equal(hourIn(out), 9);
    // Ten hours later in wall-clock terms, which is what the patient perceives.
    assert.equal(out.getTime() - winter.getTime(), 10 * 3_600_000);
  });
});
