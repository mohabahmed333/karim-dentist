import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { parseProposedActions } from "./parseProposedActions.ts";

const good = {
  id: "a1",
  kind: "chart.set_surfaces",
  label: "Decay 16",
  dependsOn: [],
  payload: { fdi: "16", occlusal: "decay" },
};
const good2 = {
  id: "a2",
  kind: "chart.set_surfaces",
  label: "Decay 17",
  dependsOn: [],
  payload: { fdi: "17", occlusal: "decay" },
};

describe("parseProposedActions", () => {
  it("keeps every valid action", () => {
    const out = parseProposedActions([good, good2]);
    assert.deepEqual(out.actions.map((a: { id: string }) => a.id), ["a1", "a2"]);
    assert.equal(out.dropped, 0);
  });

  /**
   * The regression: previously a single malformed entry made
   * z.array(...).safeParse() fail, discarding the whole batch. A three-tooth
   * charting proposal silently became zero actions.
   */
  it("keeps valid actions when a sibling is malformed", () => {
    const out = parseProposedActions([good, { id: "bad" }, good2]);
    assert.deepEqual(out.actions.map((a: { id: string }) => a.id), ["a1", "a2"]);
    assert.equal(out.dropped, 1);
  });

  it("drops unknown action kinds but keeps the rest", () => {
    const out = parseProposedActions([
      good,
      { id: "x", kind: "ignore.previous.instructions", label: "x", payload: {} },
    ]);
    assert.deepEqual(out.actions.map((a: { id: string }) => a.id), ["a1"]);
    assert.equal(out.dropped, 1);
  });

  it("returns empty for a non-array, null, or undefined", () => {
    for (const input of [null, undefined, "nope", 42, { a: 1 }]) {
      const out = parseProposedActions(input);
      assert.deepEqual(out.actions, []);
      assert.equal(out.dropped, 0);
    }
  });

  it("counts every dropped entry when all are invalid", () => {
    const out = parseProposedActions([{ id: "b1" }, { id: "b2" }]);
    assert.deepEqual(out.actions, []);
    assert.equal(out.dropped, 2);
  });

  it("applies schema defaults, so dependsOn is always present", () => {
    const out = parseProposedActions([
      { id: "a3", kind: "treatment.complete", label: "Done", payload: {} },
    ]);
    assert.equal(out.actions.length, 1);
    assert.deepEqual(out.actions[0].dependsOn, []);
  });
});
