import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { selectRelevant } from "./search.ts";

/**
 * OR-ing the patient's words means almost any message matches *something*.
 * These rules decide what is an answer and what is a coincidence.
 */
describe("selectRelevant", () => {
  it("keeps the entries clustered near the best match", () => {
    // Real ranks from "how much is teeth whitening?" against the seeded table.
    const out = selectRelevant([
      { rank: 0.0274, id: "whitening" },
      { rank: 0.0243, id: "whitening-laser" },
      { rank: 0.0122, id: "implants" },
    ]);
    assert.deepEqual(out.map((r) => r.id), ["whitening", "whitening-laser"]);
  });

  it("drops everything when nothing clears the absolute floor", () => {
    assert.deepEqual(selectRelevant([{ rank: 0.001 }, { rank: 0.002 }]), []);
  });

  it("keeps a lone strong match", () => {
    assert.deepEqual(selectRelevant([{ rank: 0.05, id: "x" }]).length, 1);
  });

  it("handles an empty result", () => {
    assert.deepEqual(selectRelevant([]), []);
  });

  it("is scale-free — the same shape survives at different magnitudes", () => {
    // ts_rank values shift with document length and query size, so a fixed
    // cutoff would behave differently for a long entry than a short one.
    const low = selectRelevant([{ rank: 0.04, id: "a" }, { rank: 0.011, id: "b" }]);
    const high = selectRelevant([{ rank: 0.4, id: "a" }, { rank: 0.11, id: "b" }]);
    assert.deepEqual(low.map((r) => r.id), high.map((r) => r.id));
  });
});
