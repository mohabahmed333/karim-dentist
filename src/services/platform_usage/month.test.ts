import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { utcMonthStartIso } from "./month.ts";

test("returns the UTC calendar month start for a date in September", () => {
  assert.equal(
    utcMonthStartIso(new Date("2026-09-07T21:04:00.000Z")),
    "2026-09-01T00:00:00.000Z",
  );
});
