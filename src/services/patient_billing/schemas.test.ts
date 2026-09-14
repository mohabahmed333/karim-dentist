import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { billingEntryUpsertSchema } from "./schemas";

describe("billingEntryUpsertSchema", () => {
  it("accepts a manual charge with no method", () => {
    const parsed = billingEntryUpsertSchema.parse({
      kind: "charge",
      amount_egp: 500,
      description: "Consultation fee",
      method: null,
    });
    assert.equal(parsed.amount_egp, 500);
    assert.equal(parsed.method, null);
  });

  it("accepts a payment with a method", () => {
    const parsed = billingEntryUpsertSchema.parse({
      kind: "payment",
      amount_egp: 1200,
      description: "Paid at desk",
      method: "cash",
    });
    assert.equal(parsed.method, "cash");
  });

  it("rejects a payment with no method", () => {
    assert.throws(() =>
      billingEntryUpsertSchema.parse({
        kind: "payment",
        amount_egp: 1200,
        description: "Paid at desk",
        method: null,
      }),
    );
  });

  it("rejects a non-positive amount", () => {
    assert.throws(() =>
      billingEntryUpsertSchema.parse({
        kind: "charge",
        amount_egp: 0,
        description: "Free consult",
        method: null,
      }),
    );
  });

  it("rejects an empty description", () => {
    assert.throws(() =>
      billingEntryUpsertSchema.parse({
        kind: "charge",
        amount_egp: 100,
        description: "  ",
        method: null,
      }),
    );
  });
});
