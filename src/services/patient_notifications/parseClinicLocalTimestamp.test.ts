import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clinicOffsetMinutes,
  // @ts-expect-error -- Node strip-types needs the extension.
  parseClinicLocalTimestamp,
} from "./formatWhen.ts";

describe("parseClinicLocalTimestamp", () => {
  /**
   * The bug this exists for: an Egyptian receipt prints a bare wall clock, and
   * resolving it against the server's zone put the transfer three hours into
   * the future — so every fresh receipt failed the "not from the future" check.
   */
  it("reads a zone-less summer timestamp as Cairo time, not UTC", () => {
    // 15 Sept is summer: Egypt is UTC+3, so 17:30 Cairo is 14:30 UTC.
    assert.equal(
      parseClinicLocalTimestamp("2026-09-15T17:30:00"),
      "2026-09-15T14:30:00.000Z",
    );
  });

  it("reads a zone-less winter timestamp at the winter offset", () => {
    // 15 Jan is winter: UTC+2, so 17:30 Cairo is 15:30 UTC.
    assert.equal(
      parseClinicLocalTimestamp("2026-01-15T17:30:00"),
      "2026-01-15T15:30:00.000Z",
    );
  });

  /** A receipt that named its own zone is already an instant. */
  it("trusts a timestamp that carries its own offset", () => {
    assert.equal(
      parseClinicLocalTimestamp("2026-09-15T14:30:00Z"),
      "2026-09-15T14:30:00.000Z",
    );
    assert.equal(
      parseClinicLocalTimestamp("2026-09-15T17:30:00+03:00"),
      "2026-09-15T14:30:00.000Z",
    );
  });

  it("reads the human formats a receipt actually prints", () => {
    assert.equal(
      parseClinicLocalTimestamp("13 Sep 2026, 11:45 AM"),
      "2026-09-13T08:45:00.000Z",
    );
  });

  it("returns null for anything with no date in it", () => {
    for (const junk of ["", "   ", "not a date", "—"]) {
      assert.equal(parseClinicLocalTimestamp(junk), null, junk);
    }
  });

  /**
   * The whole point: a transfer made a minute ago must not read as future.
   * Built from the clinic's own current wall clock rather than a fixed string,
   * so this keeps working across the DST change.
   */
  it("never reads a just-made transfer as being in the future", () => {
    const now = new Date();
    const wall = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Africa/Cairo",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    }).format(now).replace(" ", "T");

    const parsed = parseClinicLocalTimestamp(wall);
    assert.ok(parsed, "should parse");
    const drift = Math.abs(Date.parse(parsed!) - now.getTime());
    assert.ok(drift < 2000, `parsed instant drifted ${drift}ms from now`);
  });
});

describe("clinicOffsetMinutes", () => {
  it("tracks Egypt's daylight saving rather than hardcoding an offset", () => {
    assert.equal(clinicOffsetMinutes(new Date("2026-01-15T12:00:00Z")), 120);
    assert.equal(clinicOffsetMinutes(new Date("2026-07-15T12:00:00Z")), 180);
  });
});
