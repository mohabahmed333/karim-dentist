import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { parseClinicLocalTimestamp } from "./parseClinicLocalTimestamp.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { clinicOffsetMinutes } from "./formatWhen.ts";

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
    assert.equal(
      parseClinicLocalTimestamp("2026-09-15T17:30:00+0300"),
      "2026-09-15T14:30:00.000Z",
    );
  });

  /**
   * A receipt image never prints UTC — it prints the phone's own clock. The
   * extraction prompt asks for ISO, and models habitually append a "Z" to a
   * local clock they never converted. Read that way it is three hours in the
   * future, which is exactly the failure this module exists to stop, so the
   * caller can refuse to believe a zone it knows was invented.
   */
  it("can be told to ignore a zone the model invented", () => {
    assert.equal(
      parseClinicLocalTimestamp("2026-09-15T17:30:00Z", { trustNamedZone: false }),
      "2026-09-15T14:30:00.000Z",
    );
  });

  it("reads the human formats a receipt actually prints", () => {
    assert.equal(
      parseClinicLocalTimestamp("13 Sep 2026, 11:45 AM"),
      "2026-09-13T08:45:00.000Z",
    );
    assert.equal(
      parseClinicLocalTimestamp("Sep 13, 2026 11:45:03 AM"),
      "2026-09-13T08:45:03.000Z",
    );
    assert.equal(
      parseClinicLocalTimestamp("13 September 2026 11:45"),
      "2026-09-13T08:45:00.000Z",
    );
  });

  /**
   * Egypt writes the day first. Handing "13/09/2026" to Date.parse returns
   * NaN — the commonest format on an Egyptian banking app was unreadable —
   * and "05/09/2026" parsed as 9 May instead of 5 September, which is a
   * silent four-month error, not a refusal.
   */
  describe("day-first dates, as Egypt writes them", () => {
    for (const [input, expected] of [
      ["13/09/2026 2:41 PM", "2026-09-13T11:41:00.000Z"],
      ["13-09-2026 14:41", "2026-09-13T11:41:00.000Z"],
      ["13.09.2026 14:41", "2026-09-13T11:41:00.000Z"],
      ["05/09/2026 14:41", "2026-09-05T11:41:00.000Z"],
      ["13/09/26 14:41", "2026-09-13T11:41:00.000Z"],
      ["13/09/2026", "2026-09-12T21:00:00.000Z"],
    ] as const) {
      it(input, () => assert.equal(parseClinicLocalTimestamp(input), expected));
    }

    /** Only when day-first is impossible is it read the other way round. */
    it("falls back to month-first when the middle number cannot be a month", () => {
      assert.equal(
        parseClinicLocalTimestamp("09/13/2026 14:41"),
        "2026-09-13T11:41:00.000Z",
      );
    });

    it("still reads a year-first date the way it is written", () => {
      assert.equal(
        parseClinicLocalTimestamp("2026/09/13 14:41"),
        "2026-09-13T11:41:00.000Z",
      );
    });
  });

  /** A date with no clock is midnight in Cairo, whatever zone the server is in. */
  it("reads a bare date as Cairo midnight", () => {
    assert.equal(parseClinicLocalTimestamp("2026-09-13"), "2026-09-12T21:00:00.000Z");
  });

  describe("Arabic as the banking apps print it", () => {
    for (const [input, expected] of [
      ["١٣/٠٩/٢٠٢٦ ٢:٤١ م", "2026-09-13T11:41:00.000Z"],
      ["٢:٤١ م ١٣/٠٩/٢٠٢٦", "2026-09-13T11:41:00.000Z"],
      ["13/09/2026 2:41 ص", "2026-09-12T23:41:00.000Z"],
      ["١٣ سبتمبر ٢٠٢٦ ١١:٤٥", "2026-09-13T08:45:00.000Z"],
      ["13 أغسطس 2026 11:45", "2026-08-13T08:45:00.000Z"],
    ] as const) {
      it(input, () => assert.equal(parseClinicLocalTimestamp(input), expected));
    }

    /** A right-to-left screenshot carries invisible direction marks. */
    it("ignores the bidi marks an Arabic screenshot carries", () => {
      assert.equal(
        parseClinicLocalTimestamp("‏13/09/2026‫ 2:41 PM‎"),
        "2026-09-13T11:41:00.000Z",
      );
    });

    it("ignores a non-breaking space between the clock and the meridiem", () => {
      assert.equal(
        parseClinicLocalTimestamp("13/09/2026 2:41 PM"),
        "2026-09-13T11:41:00.000Z",
      );
    });
  });

  describe("midnight and noon, which meridiem arithmetic gets wrong", () => {
    for (const [input, expected] of [
      ["13/09/2026 12:30 AM", "2026-09-12T21:30:00.000Z"],
      ["13/09/2026 12:30 PM", "2026-09-13T09:30:00.000Z"],
      ["13/09/2026 ١٢:٣٠ ص", "2026-09-12T21:30:00.000Z"],
    ] as const) {
      it(input, () => assert.equal(parseClinicLocalTimestamp(input), expected));
    }
  });

  /**
   * Refusing costs one trip to the staff queue. Guessing puts a wrong date on
   * someone's payment, so everything doubtful becomes null.
   */
  describe("refuses rather than guesses", () => {
    for (const junk of [
      "",
      "   ",
      "not a date",
      "—",
      "13 Sep 11:45", // No year: Date.parse called this 2001.
      "11:45 AM", // A clock with no date at all.
      "32/09/2026",
      "31/02/2026", // A day that does not exist in that month.
      "13/13/2026",
      "13/09/2026 25:41",
      "13/09/2026 14:71",
      "13/09/1026", // A year no banking app printed.
      "ref 1309 2026 amount 200",
    ]) {
      it(JSON.stringify(junk), () => assert.equal(parseClinicLocalTimestamp(junk), null));
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

  /**
   * Date.parse reads a bare ISO date as UTC but a bare ISO date-time as the
   * server's local time, so the old implementation gave three different
   * instants for one receipt depending on where it ran. Nothing here consults
   * the server's zone, so the answer is the same everywhere.
   */
  it("gives the same answer whatever zone the server runs in", () => {
    assert.equal(parseClinicLocalTimestamp("2026-09-13", { timeZone: "Africa/Cairo" }),
      "2026-09-12T21:00:00.000Z");
    assert.equal(parseClinicLocalTimestamp("2026-09-13", { timeZone: "Asia/Tokyo" }),
      "2026-09-12T15:00:00.000Z");
  });
});

describe("clinicOffsetMinutes", () => {
  it("tracks Egypt's daylight saving rather than hardcoding an offset", () => {
    assert.equal(clinicOffsetMinutes(new Date("2026-01-15T12:00:00Z")), 120);
    assert.equal(clinicOffsetMinutes(new Date("2026-07-15T12:00:00Z")), 180);
  });
});
