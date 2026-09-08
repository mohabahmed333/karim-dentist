import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  defaultOverviewFromTo,
  dayIso,
} from "./reservationFilters.ts";

describe("defaultOverviewFromTo", () => {
  it("spans past month through two weeks ahead", () => {
    const now = new Date(2026, 8, 8, 12, 0, 0);
    const range = defaultOverviewFromTo(now);
    assert.equal(range.from, dayIso(new Date(2026, 7, 10)));
    assert.equal(range.to, dayIso(new Date(2026, 8, 22)));
  });
});
