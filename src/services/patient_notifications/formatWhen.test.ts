import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  BUTTON_TITLE_LIMIT,
  formatAppointmentDateTime,
  formatAppointmentTime,
  formatSlotButtonLabel,
  isTomorrowIn,
} from "./formatWhen.ts";

// Egypt reintroduced DST in 2023, so Cairo is UTC+2 in winter and UTC+3 in
// summer. Anything that hardcodes +02:00 sends every summer appointment an hour
// wrong. These two cases are the regression guard, and they also fail loudly on
// a runtime built without full ICU.
describe("formatAppointmentDateTime — Cairo, both sides of DST", () => {
  it("renders a winter appointment at UTC+2", () => {
    const out = formatAppointmentDateTime("2026-01-15T08:00:00Z", "en");
    assert.match(out, /15 January 2026/);
    assert.match(out, /10:00/);
  });

  it("renders a summer appointment at UTC+3", () => {
    const out = formatAppointmentDateTime("2026-07-15T07:00:00Z", "en");
    assert.match(out, /15 July 2026/);
    assert.match(out, /10:00/);
  });

  it("uses Western digits in Arabic, not Arabic-Indic", () => {
    const out = formatAppointmentDateTime("2026-07-15T07:00:00Z", "ar");
    assert.match(out, /10:00/, "expected Western digits via -u-nu-latn");
    assert.doesNotMatch(out, /[٠-٩]/, "Arabic-Indic digits leaked in");
    assert.match(out, /يوليو/, "expected an Arabic month name");
  });

  it("never emits a newline — Meta rejects template params containing one", () => {
    for (const lang of ["ar", "en"] as const) {
      assert.doesNotMatch(formatAppointmentDateTime("2026-07-15T07:00:00Z", lang), /[\n\r\t]/);
    }
  });
});

// The approved reminder body already says "tomorrow" / "بكرة", so {{3}} carries
// the time alone. Putting a full date there would read "tomorrow at Wednesday
// 15 July, 10:00".
describe("formatAppointmentTime — the reminder's {{3}}", () => {
  it("is the time only, because the template supplies the day", () => {
    const out = formatAppointmentTime("2026-07-15T07:00:00Z", "en");
    assert.match(out, /10:00/);
    assert.doesNotMatch(out, /July|15/, "the day must not appear in {{3}}");
  });

  it("respects DST in the time-only form too", () => {
    assert.match(formatAppointmentTime("2026-01-15T08:00:00Z", "en"), /10:00/);
  });
});

// Because "tomorrow" is baked into the approved text, a reminder that slips —
// deferred past midnight by quiet hours, or queued with a different lead — would
// tell the patient the wrong day. The dispatcher uses this to skip instead.
describe("isTomorrowIn — the reminder's truthfulness guard", () => {
  const CAIRO = "Africa/Cairo";

  it("is true when the appointment falls on the next calendar day in Cairo", () => {
    // now: 14 July 2026 18:00 Cairo (15:00Z, summer = UTC+3)
    // appt: 15 July 2026 10:00 Cairo
    assert.equal(isTomorrowIn("2026-07-15T07:00:00Z", new Date("2026-07-14T15:00:00Z"), CAIRO), true);
  });

  it("is false for an appointment later today", () => {
    assert.equal(isTomorrowIn("2026-07-15T07:00:00Z", new Date("2026-07-15T05:00:00Z"), CAIRO), false);
  });

  it("is false for an appointment two days out", () => {
    assert.equal(isTomorrowIn("2026-07-16T07:00:00Z", new Date("2026-07-14T15:00:00Z"), CAIRO), false);
  });

  it("judges the day in Cairo, not UTC", () => {
    // 2026-07-14T22:30Z is already 15 July 01:30 in Cairo, so a 16 July
    // appointment is "tomorrow" there while UTC would still call it two days out.
    assert.equal(isTomorrowIn("2026-07-16T07:00:00Z", new Date("2026-07-14T22:30:00Z"), CAIRO), true);
  });
});

describe("formatSlotButtonLabel", () => {
  // Cairo is UTC+3 in summer and UTC+2 in winter; both of these are 10:30 local.
  const summer = "2026-07-15T07:30:00.000Z";
  const winter = "2026-01-15T08:30:00.000Z";

  it("names a day and a time, in English", () => {
    const label = formatSlotButtonLabel(summer, "en");
    assert.match(label, /[A-Za-z]{3}/);
    assert.match(label, /10:30/);
  });

  it("names a day and a time, in Arabic", () => {
    const label = formatSlotButtonLabel(summer, "ar");
    assert.match(label, /\p{Script=Arabic}/u);
    assert.match(label, /10:30/);
  });

  it("reads the clinic's own clock on both sides of daylight saving", () => {
    for (const at of [summer, winter]) {
      assert.match(formatSlotButtonLabel(at, "en"), /10:30/);
      assert.match(formatSlotButtonLabel(at, "ar"), /10:30/);
    }
  });

  /** Over this, WhatsApp rejects the message outright rather than the label. */
  it("never exceeds what WhatsApp accepts for a button title", () => {
    for (let day = 1; day <= 28; day += 1) {
      const at = `2026-09-${String(day).padStart(2, "0")}T07:30:00.000Z`;
      for (const language of ["ar", "en"] as const) {
        assert.ok(
          formatSlotButtonLabel(at, language).length <= BUTTON_TITLE_LIMIT,
          `${language} ${at}: ${formatSlotButtonLabel(at, language)}`,
        );
      }
    }
  });
});
