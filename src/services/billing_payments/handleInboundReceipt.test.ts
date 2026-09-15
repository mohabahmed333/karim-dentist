import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { handleInboundBillingReceipt } from "./handleInboundReceipt.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { receiptExtractionSchema } from "@/services/deposits/receiptSchema.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "@/services/admin_ai/testing/fakeDb.ts";

const NOW = new Date("2026-09-15T12:00:00Z");
const CONVERSATION = "conv-1";

const SETTINGS = {
  id: "d1",
  enabled: true,
  amount_egp: 200,
  currency: "EGP",
  instapay_handle: "clinic@instapay",
  wallet_number: "01005551234",
  recipient_names: ["Dental Lounge"],
  hold_minutes: 30,
  auto_confirm: true,
  min_confidence: 0.75,
  amount_tolerance_egp: 0,
  receipt_max_age_hours: 48,
  updated_at: NOW.toISOString(),
};

const REQUEST = {
  id: "req-1",
  proposal_id: "prop-1",
  patient_key: "patient-1",
  patient_name: "Sara",
  reservation_id: null,
  conversation_id: CONVERSATION,
  phone: "01005559999",
  amount_egp: 1500,
  description: "Root canal",
  status: "awaiting_receipt",
  settings_snapshot: {},
  decided_at: null,
  decided_by: null,
  decision_reason: "",
  created_at: "2026-09-15T11:50:00Z",
  updated_at: "2026-09-15T11:50:00Z",
};

const GOOD_EXTRACTION = receiptExtractionSchema.parse({
  isReceipt: true,
  amount: 1500,
  currency: "EGP",
  reference: "FT999",
  recipientHandle: "clinic@instapay",
  transferredAt: "2026-09-15T11:55:00Z",
  confidence: 0.95,
});

const image = {
  bytes: new Uint8Array([1]),
  sha256: "hash-abc",
  mime: "image/jpeg" as const,
  dataUri: "data:image/jpeg;base64,AQ==",
};

const inbound = (over: Record<string, unknown> = {}) => ({
  conversationId: CONVERSATION,
  messageId: "msg-1",
  messageType: "image",
  mediaUrl: "https://kapso.test/r.jpg",
  language: "en" as const,
  ...over,
});

function deps(over: Record<string, unknown> = {}, dbOver: Record<string, unknown> = {}) {
  const db = createFakeDb({
    tables: { deposit_settings: [SETTINGS], billing_payment_requests: [REQUEST] },
    ...dbOver,
  });
  return {
    db: {
      db: db as never,
      fetchImage: (async () => image) as never,
      read: (async () => ({
        extraction: GOOD_EXTRACTION,
        model: "gemini:x",
        promptVersion: "v1",
        latencyMs: 10,
      })) as never,
      now: () => NOW,
      ...over,
    },
    fake: db,
  };
}

describe("handleInboundBillingReceipt — what it refuses to touch", () => {
  it("passes a text message through", async () => {
    const { db } = deps();
    const out = await handleInboundBillingReceipt(db, inbound({ messageType: "text" }));
    assert.deepEqual(out, { handled: false });
  });

  it("passes an image through when no billing request is being waited on", async () => {
    const { db } = deps({}, { tables: { deposit_settings: [SETTINGS], billing_payment_requests: [] } });
    assert.deepEqual(await handleInboundBillingReceipt(db, inbound()), { handled: false });
  });

  it("passes through when payment settings have never been written", async () => {
    const { db } = deps({}, { tables: { deposit_settings: [], billing_payment_requests: [REQUEST] } });
    assert.deepEqual(await handleInboundBillingReceipt(db, inbound()), { handled: false });
  });
});

describe("handleInboundBillingReceipt — the happy path", () => {
  it("confirms the payment exactly once and tells the patient", async () => {
    const { db, fake } = deps();
    const out = await handleInboundBillingReceipt(db, inbound());
    assert.equal(out.handled, true);
    assert.equal(out.outcome, "confirmed");
    assert.match(out.replyText, /received/i);

    const confirms = fake.rpcCalls().filter((c) => c.fn === "confirm_billing_payment");
    assert.equal(confirms.length, 1);
    assert.equal(confirms[0].args.p_billing_payment_request_id, "req-1");
  });

  it("writes the receipt down before deciding", async () => {
    const { db, fake } = deps();
    await handleInboundBillingReceipt(db, inbound());
    const inserts = fake.insertsTo("billing_payment_receipts");
    assert.equal(inserts.length, 1);
    assert.equal(inserts[0].values.image_sha256, "hash-abc");
    assert.equal(inserts[0].values.reference, "FT999");
  });
});

describe("handleInboundBillingReceipt — replay", () => {
  it("rejects a screenshot the database has already seen", async () => {
    const { db, fake } = deps(
      {},
      {
        failOn: {
          "billing_payment_receipts.insert": {
            message: 'duplicate key value violates unique constraint "billing_payment_receipts_image_unique"',
          },
        },
      },
    );
    const out = await handleInboundBillingReceipt(db, inbound());
    assert.equal(out.outcome, "rejected");
    assert.equal(out.reason, "duplicate_image");
    assert.equal(fake.rpcCalls().filter((c) => c.fn === "confirm_billing_payment").length, 0);
    assert.equal(fake.rpcCalls().filter((c) => c.fn === "reject_billing_payment").length, 1);
  });
});

describe("handleInboundBillingReceipt — manual review mode", () => {
  it("holds a flawless receipt for staff when auto-confirm is off", async () => {
    const { db, fake } = deps(
      {},
      { tables: { deposit_settings: [{ ...SETTINGS, auto_confirm: false }], billing_payment_requests: [REQUEST] } },
    );
    const out = await handleInboundBillingReceipt(db, inbound());
    assert.equal(out.outcome, "review");
    assert.equal(out.reason, "manual_review_mode");
    assert.equal(fake.rpcCalls().filter((c) => c.fn === "confirm_billing_payment").length, 0);
  });
});
