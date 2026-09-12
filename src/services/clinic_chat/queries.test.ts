import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { isRecentEnoughToResume } from "./queries.ts";

const NOW = new Date("2026-09-12T12:00:00.000Z");

describe("isRecentEnoughToResume", () => {
  it("resumes a thread updated moments ago", () => {
    assert.equal(isRecentEnoughToResume("2026-09-12T11:59:00.000Z", NOW), true);
  });

  it("resumes a thread right at the 24h boundary", () => {
    assert.equal(isRecentEnoughToResume("2026-09-11T12:00:00.000Z", NOW), true);
  });

  it("does not resume a thread just past 24h old", () => {
    assert.equal(isRecentEnoughToResume("2026-09-11T11:59:59.000Z", NOW), false);
  });

  it("does not resume a thread from days ago", () => {
    assert.equal(isRecentEnoughToResume("2026-09-01T12:00:00.000Z", NOW), false);
  });
});
