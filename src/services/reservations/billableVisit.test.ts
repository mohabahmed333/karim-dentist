import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { isBillableVisit } from "./billableVisit.ts";

const NOON = new Date(2026, 8, 16, 12, 0, 0);
const on = (day: number, hour: number, status = "confirmed") => ({
  starts_at: new Date(2026, 8, day, hour, 0, 0).toISOString(),
  status: status as "confirmed",
});

describe("isBillableVisit", () => {
  it("bills today's visit once it has started", () => {
    assert.equal(isBillableVisit(on(16, 11), NOON), true);
  });

  it("bills a visit starting exactly now", () => {
    assert.equal(isBillableVisit(on(16, 12), NOON), true);
  });

  it("refuses a visit still to come today", () => {
    assert.equal(isBillableVisit(on(16, 14), NOON), false);
  });

  it("refuses yesterday's visit", () => {
    assert.equal(isBillableVisit(on(15, 10), NOON), false);
  });

  it("refuses a visit from days ago", () => {
    assert.equal(isBillableVisit(on(6, 10), NOON), false);
  });

  it("refuses a cancelled visit even today", () => {
    assert.equal(isBillableVisit(on(16, 9, "cancelled"), NOON), false);
  });

  it("still bills today's no-show, so a missed-visit fee has somewhere to go", () => {
    assert.equal(isBillableVisit(on(16, 9, "no_show"), NOON), true);
  });
});
