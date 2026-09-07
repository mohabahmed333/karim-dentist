import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { formatAppointmentLabel, bookModeForStatus } from "./appointmentLabel.ts";

describe("formatAppointmentLabel", () => {
  it("returns a compact weekday date-time for an ISO instant", () => {
    const label = formatAppointmentLabel("2026-09-05T10:00:00.000Z");
    assert.ok(label.length > 8);
    assert.match(label, /\d/);
  });
});

describe("bookModeForStatus", () => {
  it("opens book for open rows and replace when already scheduled or done", () => {
    assert.equal(bookModeForStatus("open"), "book");
    assert.equal(bookModeForStatus("scheduled"), "replace");
    assert.equal(bookModeForStatus("done"), "replace");
  });
});
