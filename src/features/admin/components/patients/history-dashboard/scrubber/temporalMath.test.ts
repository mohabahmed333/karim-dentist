import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  dateToPixel,
  enforceMinWindow,
  pixelToDate,
  snapToEvents,
} from "./temporalMath.ts";

describe("temporal scrubber math", () => {
  const minDate = new Date(2014, 0, 1);
  const maxDate = new Date(2022, 11, 31);

  it("maps pixels to timestamps with newest date on the left", () => {
    assert.equal(pixelToDate(0, minDate, maxDate, 800).getFullYear(), 2022);
    assert.equal(pixelToDate(800, minDate, maxDate, 800).getFullYear(), 2014);
  });

  it("snaps within 12px of an event cluster", () => {
    const eventDate = new Date(2015, 9, 7);
    const events = [{ date: eventDate }];
    const eventPx = dateToPixel(eventDate, minDate, maxDate, 800);
    const near = pixelToDate(eventPx + 10, minDate, maxDate, 800);
    const snapped = snapToEvents(near, events, minDate, maxDate, 800, 12);
    assert.equal(snapped.getFullYear(), 2015);
    assert.equal(snapped.getMonth(), 9);
  });

  it("enforces a one-month minimum window", () => {
    const start = new Date(2015, 0, 1);
    const end = new Date(2015, 0, 10);
    const [older, newer] = enforceMinWindow(start, end, minDate, maxDate, "end");
    assert.ok(newer.getTime() - older.getTime() >= 28 * 24 * 60 * 60 * 1000);
  });
});
