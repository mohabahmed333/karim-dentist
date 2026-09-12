import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { summarizeOutcomes, topFailingActionKinds, feedbackRate } from "./analyticsAggregate.ts";

describe("summarizeOutcomes", () => {
  it("counts each outcome kind", () => {
    const rows = [
      { outcome: "confirmed", action_kind: "note.general" },
      { outcome: "confirmed", action_kind: "chart.set_surfaces" },
      { outcome: "failed", action_kind: "reservation.create" },
      { outcome: "stale", action_kind: "reservation.create" },
    ];
    assert.deepEqual(summarizeOutcomes(rows), {
      proposed: 0,
      confirmed: 2,
      cancelled: 0,
      failed: 1,
      stale: 1,
    });
  });

  it("ignores a row with an unrecognised outcome rather than throwing", () => {
    assert.deepEqual(summarizeOutcomes([{ outcome: "bogus", action_kind: "x" }]), {
      proposed: 0,
      confirmed: 0,
      cancelled: 0,
      failed: 0,
      stale: 0,
    });
  });

  it("returns all zeros for no rows", () => {
    assert.deepEqual(summarizeOutcomes([]), {
      proposed: 0,
      confirmed: 0,
      cancelled: 0,
      failed: 0,
      stale: 0,
    });
  });
});

describe("topFailingActionKinds", () => {
  it("ranks kinds by failure count, most first", () => {
    const rows = [
      { outcome: "failed", action_kind: "reservation.create" },
      { outcome: "failed", action_kind: "reservation.create" },
      { outcome: "failed", action_kind: "note.general" },
      { outcome: "confirmed", action_kind: "reservation.create" },
    ];
    assert.deepEqual(topFailingActionKinds(rows), [
      { kind: "reservation.create", count: 2 },
      { kind: "note.general", count: 1 },
    ]);
  });

  it("caps at the given limit", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      outcome: "failed",
      action_kind: `kind.${i}`,
    }));
    assert.equal(topFailingActionKinds(rows, 3).length, 3);
  });

  it("returns nothing when nothing failed", () => {
    assert.deepEqual(
      topFailingActionKinds([{ outcome: "confirmed", action_kind: "note.general" }]),
      [],
    );
  });
});

describe("feedbackRate", () => {
  it("is the percentage of thumbs that were up", () => {
    assert.equal(feedbackRate(3, 1), 75);
  });

  it("is null when there is no feedback at all, not a divide-by-zero NaN", () => {
    assert.equal(feedbackRate(0, 0), null);
  });

  it("is 100 when every reaction was positive", () => {
    assert.equal(feedbackRate(5, 0), 100);
  });
});
