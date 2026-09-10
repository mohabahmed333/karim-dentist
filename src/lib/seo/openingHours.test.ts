import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  formatOpeningHoursText,
  openingHoursSpecification,
} from "./openingHours.ts";

const BASE = {
  open_weekdays: [0, 1, 2, 3, 4],
  time_windows: ["10:00-13:00", "14:00-18:00"],
  timezone: "Africa/Cairo",
};

test("emits one spec per time window, listing every open day", () => {
  const specs = openingHoursSpecification(BASE);
  assert.equal(specs?.length, 2);
  assert.deepEqual(specs?.[0], {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "https://schema.org/Sunday",
      "https://schema.org/Monday",
      "https://schema.org/Tuesday",
      "https://schema.org/Wednesday",
      "https://schema.org/Thursday",
    ],
    opens: "10:00",
    closes: "13:00",
  });
  assert.equal(specs?.[1]?.opens, "14:00");
  assert.equal(specs?.[1]?.closes, "18:00");
});

test("maps weekday numbers to the right schema.org days", () => {
  const specs = openingHoursSpecification({
    ...BASE,
    open_weekdays: [5, 6],
    time_windows: ["09:00-12:00"],
  });
  assert.deepEqual(specs?.[0]?.dayOfWeek, [
    "https://schema.org/Friday",
    "https://schema.org/Saturday",
  ]);
});

test("orders days consistently regardless of stored order", () => {
  const specs = openingHoursSpecification({
    ...BASE,
    open_weekdays: [4, 0, 2],
    time_windows: ["09:00-12:00"],
  });
  assert.deepEqual(specs?.[0]?.dayOfWeek, [
    "https://schema.org/Sunday",
    "https://schema.org/Tuesday",
    "https://schema.org/Thursday",
  ]);
});

test("ignores duplicate and out-of-range weekday values", () => {
  const specs = openingHoursSpecification({
    ...BASE,
    open_weekdays: [1, 1, 9, -3],
    time_windows: ["09:00-12:00"],
  });
  assert.deepEqual(specs?.[0]?.dayOfWeek, ["https://schema.org/Monday"]);
});

test("skips malformed windows rather than guessing", () => {
  const specs = openingHoursSpecification({
    ...BASE,
    time_windows: ["10:00-13:00", "garbage", "25:00-99:00", "14:00"],
  });
  assert.equal(specs?.length, 1);
  assert.equal(specs?.[0]?.opens, "10:00");
});

test("returns null when hours are unknown, so the key can be omitted", () => {
  assert.equal(openingHoursSpecification(null), null);
  assert.equal(openingHoursSpecification({ ...BASE, open_weekdays: [] }), null);
  assert.equal(openingHoursSpecification({ ...BASE, time_windows: [] }), null);
  assert.equal(
    openingHoursSpecification({ ...BASE, time_windows: ["nonsense"] }),
    null,
  );
});

test("normalises single-digit hours to zero-padded schema.org times", () => {
  const specs = openingHoursSpecification({
    ...BASE,
    open_weekdays: [1],
    time_windows: ["9:00-17:30"],
  });
  assert.equal(specs?.[0]?.opens, "09:00");
  assert.equal(specs?.[0]?.closes, "17:30");
});

test("formats contiguous open days into a compact range for humans", () => {
  const text = formatOpeningHoursText(BASE);
  assert.equal(text, "Sun–Thu 10:00–13:00, 14:00–18:00 (Africa/Cairo)");
});

test("formats non-contiguous days as a comma list", () => {
  const text = formatOpeningHoursText({
    ...BASE,
    open_weekdays: [0, 2, 5],
    time_windows: ["09:00-17:00"],
  });
  assert.equal(text, "Sun, Tue, Fri 09:00–17:00 (Africa/Cairo)");
});

test("returns null when there is nothing valid to format", () => {
  assert.equal(formatOpeningHoursText(null), null);
  assert.equal(formatOpeningHoursText({ ...BASE, open_weekdays: [] }), null);
});
