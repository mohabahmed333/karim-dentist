import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { proposalTotal } from "./queries";

describe("proposalTotal", () => {
  it("sums every item's amount", () => {
    const total = proposalTotal([
      { id: "1", serviceId: "s1", description: "Root canal", amountEgp: 1500 },
      { id: "2", serviceId: "s2", description: "Crown", amountEgp: 2000 },
    ]);
    assert.equal(total, 3500);
  });

  it("returns zero for no items", () => {
    assert.equal(proposalTotal([]), 0);
  });
});
