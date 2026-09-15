import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { toQueueRow } from "./queries.ts";

describe("toQueueRow", () => {
  it("picks the newest receipt when several were sent", () => {
    const row = toQueueRow({
      id: "req-1",
      status: "in_review",
      amount_egp: 1500,
      description: "Root canal",
      decision_reason: "low_confidence",
      phone: "01005559999",
      patient_name: "Sara",
      created_at: "2026-09-15T10:00:00Z",
      billing_payment_receipts: [
        {
          id: "r1",
          image_url: "u1",
          amount_egp: 1000,
          reference: "A",
          sender_name: null,
          recipient_name: null,
          recipient_handle: null,
          transferred_at: null,
          confidence: 0.5,
          verdict: "review",
          verdict_reason: "low_confidence",
          extracted: {},
          created_at: "2026-09-15T10:01:00Z",
        },
        {
          id: "r2",
          image_url: "u2",
          amount_egp: 1500,
          reference: "B",
          sender_name: null,
          recipient_name: null,
          recipient_handle: null,
          transferred_at: null,
          confidence: 0.9,
          verdict: "review",
          verdict_reason: "low_confidence",
          extracted: {},
          created_at: "2026-09-15T10:05:00Z",
        },
      ],
    });
    assert.equal(row.receipt?.id, "r2");
    assert.equal(row.receiptCount, 2);
  });

  it("has no receipt when none were sent yet", () => {
    const row = toQueueRow({
      id: "req-1",
      status: "awaiting_receipt",
      amount_egp: 1500,
      description: "Root canal",
      decision_reason: "",
      phone: "01005559999",
      patient_name: "Sara",
      created_at: "2026-09-15T10:00:00Z",
      billing_payment_receipts: [],
    });
    assert.equal(row.receipt, null);
    assert.equal(row.receiptCount, 0);
  });
});
