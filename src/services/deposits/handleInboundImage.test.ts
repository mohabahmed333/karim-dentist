import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { handleInboundImage } from "./handleInboundImage.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { receiptExtractionSchema } from "./receiptSchema.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "@/services/admin_ai/testing/fakeDb.ts";

const NOW = new Date("2026-09-13T12:00:00Z");
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
  reservation_id: "res-1",
  conversation_id: CONVERSATION,
  slot_id: "slot-1",
  phone: "01005559999",
  amount_egp: 200,
  status: "awaiting_receipt",
  expires_at: "2026-09-13T12:20:00Z",
  settings_snapshot: {},
  decided_at: null,
  decided_by: null,
  decision_reason: "",
  created_at: "2026-09-13T11:50:00Z",
  updated_at: "2026-09-13T11:50:00Z",
};

const GOOD_EXTRACTION = receiptExtractionSchema.parse({
  isReceipt: true,
  amount: 200,
  currency: "EGP",
  reference: "FT999",
  recipientHandle: "clinic@instapay",
  transferredAt: "2026-09-13T11:55:00Z",
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
    tables: { deposit_settings: [SETTINGS], deposit_requests: [REQUEST] },
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

describe("handleInboundImage — what it refuses to touch", () => {
  it("passes a text message through", async () => {
    const { db } = deps();
    const out = await handleInboundImage(db, inbound({ messageType: "text" }));
    assert.deepEqual(out, { handled: false });
  });

  it("passes everything through when deposits are switched off", async () => {
    const { db, fake } = deps({}, { tables: { deposit_settings: [{ ...SETTINGS, enabled: false }], deposit_requests: [REQUEST] } });
    const out = await handleInboundImage(db, inbound());
    assert.deepEqual(out, { handled: false });
    // And it never went looking for a deposit, let alone fetched the image.
    assert.equal(fake.rpcCalls().length, 0);
  });

  it("passes an image through when no deposit is being waited on", async () => {
    // A photo of a tooth must behave exactly as it did before this feature.
    const { db } = deps({}, { tables: { deposit_settings: [SETTINGS], deposit_requests: [] } });
    assert.deepEqual(await handleInboundImage(db, inbound()), { handled: false });
  });

  it("passes through when deposit settings have never been written", async () => {
    const { db } = deps({}, { tables: { deposit_settings: [], deposit_requests: [REQUEST] } });
    assert.deepEqual(await handleInboundImage(db, inbound()), { handled: false });
  });
});

describe("handleInboundImage — the happy path", () => {
  it("confirms the deposit exactly once and tells the patient", async () => {
    const { db, fake } = deps();
    const out = await handleInboundImage(db, inbound());
    assert.equal(out.handled, true);
    assert.equal(out.outcome, "confirmed");
    assert.match(out.replyText, /confirmed/);

    const confirms = fake.rpcCalls().filter((c) => c.fn === "confirm_deposit_paid");
    assert.equal(confirms.length, 1);
    assert.equal(confirms[0].args.p_deposit_request_id, "req-1");
  });

  it("writes the receipt down before deciding", async () => {
    const { db, fake } = deps();
    await handleInboundImage(db, inbound());
    const inserts = fake.insertsTo("deposit_receipts");
    assert.equal(inserts.length, 1);
    assert.equal(inserts[0].values.image_sha256, "hash-abc");
    assert.equal(inserts[0].values.reference, "FT999");
    assert.equal(inserts[0].values.model, "gemini:x");
  });
});

describe("handleInboundImage — replay", () => {
  it("rejects a screenshot the database has already seen, and never confirms", async () => {
    const { db, fake } = deps(
      {},
      { failOn: { "deposit_receipts.insert": { message: 'duplicate key value violates unique constraint "deposit_receipts_image_unique"' } } },
    );
    const out = await handleInboundImage(db, inbound());
    assert.equal(out.outcome, "rejected");
    assert.equal(out.reason, "duplicate_image");
    // The point of asserting on the fake: prove the confirm never happened.
    assert.equal(fake.rpcCalls().filter((c) => c.fn === "confirm_deposit_paid").length, 0);
    assert.equal(fake.rpcCalls().filter((c) => c.fn === "reject_deposit").length, 1);
  });

  it("distinguishes a reused reference from a reused image", async () => {
    const { db } = deps(
      {},
      { failOn: { "deposit_receipts.insert": { message: 'duplicate key value violates unique constraint "deposit_receipts_reference_unique"' } } },
    );
    const out = await handleInboundImage(db, inbound());
    assert.equal(out.reason, "duplicate_reference");
  });
});

describe("handleInboundImage — the hold", () => {
  it("releases an expired hold instead of reading the receipt", async () => {
    const { db, fake } = deps(
      {},
      { tables: { deposit_settings: [SETTINGS], deposit_requests: [{ ...REQUEST, expires_at: "2026-09-13T11:59:00Z" }] } },
    );
    const out = await handleInboundImage(db, inbound());
    assert.equal(out.outcome, "expired");
    assert.match(out.replyText, /released/);
    assert.equal(fake.rpcCalls().filter((c) => c.fn === "expire_deposit_hold").length, 1);
    assert.equal(fake.insertsTo("deposit_receipts").length, 0);
  });
});

describe("handleInboundImage — our own failures never cost the patient their slot", () => {
  it("parks with staff when the image cannot be fetched", async () => {
    const { db, fake } = deps({
      fetchImage: (async () => {
        const { ReceiptImageError } = await import("./fetchReceiptImage.ts");
        throw new ReceiptImageError("timeout");
      }) as never,
    });
    const out = await handleInboundImage(db, inbound());
    assert.equal(out.outcome, "review");
    assert.equal(out.reason, "image_timeout");
    assert.match(out.replyText, /still held/);
    // Never expired, never rejected.
    assert.equal(fake.rpcCalls().filter((c) => c.fn === "reject_deposit").length, 0);
    assert.equal(fake.rpcCalls().filter((c) => c.fn === "expire_deposit_hold").length, 0);
  });

  it("parks with staff when no model can read it, recorded as unreadable", async () => {
    const { db, fake } = deps({
      read: (async () => {
        const { ReceiptReadError } = await import("./readReceipt.ts");
        throw new ReceiptReadError("no_vision_model");
      }) as never,
    });
    const out = await handleInboundImage(db, inbound());
    assert.equal(out.outcome, "review");
    assert.equal(out.reason, "no_vision_model");

    const inserted = fake.insertsTo("deposit_receipts")[0].values;
    // 'unreadable' keeps the row out of the reference unique index, so our own
    // failure cannot spend a reference number we never actually read.
    assert.equal(inserted.verdict, "unreadable");
    assert.equal(inserted.verdict_reason, "no_vision_model");
    assert.equal(fake.updatesTo("deposit_requests")[0].values.status, "in_review");
  });

  it("parks with staff when the message carries no media url", async () => {
    const { db } = deps();
    const out = await handleInboundImage(db, inbound({ mediaUrl: "" }));
    assert.equal(out.outcome, "review");
    assert.equal(out.reason, "no_media_url");
  });
});

describe("handleInboundImage — the verdict is the verifier's", () => {
  it("rejects a short amount and quantifies it for the patient", async () => {
    const short = receiptExtractionSchema.parse({
      ...GOOD_EXTRACTION,
      amount: 50,
      isReceipt: true,
      confidence: 0.95,
      recipientHandle: "clinic@instapay",
      reference: "FT111",
      transferredAt: "2026-09-13T11:55:00Z",
    });
    const { db } = deps({
      read: (async () => ({ extraction: short, model: "m", promptVersion: "v", latencyMs: 1 })) as never,
    });
    const out = await handleInboundImage(db, inbound());
    assert.equal(out.outcome, "rejected");
    assert.equal(out.reason, "amount_short");
    assert.match(out.replyText, /EGP 150/);
  });

  it("holds a flawless receipt for staff when auto-confirm is off", async () => {
    const { db, fake } = deps(
      {},
      { tables: { deposit_settings: [{ ...SETTINGS, auto_confirm: false }], deposit_requests: [REQUEST] } },
    );
    const out = await handleInboundImage(db, inbound());
    assert.equal(out.outcome, "review");
    assert.equal(out.reason, "manual_review_mode");
    assert.equal(fake.rpcCalls().filter((c) => c.fn === "confirm_deposit_paid").length, 0);
  });

  it("holds a transfer to somebody else", async () => {
    const wrong = receiptExtractionSchema.parse({
      isReceipt: true,
      amount: 200,
      reference: "FT222",
      recipientHandle: "someone@instapay",
      transferredAt: "2026-09-13T11:55:00Z",
      confidence: 0.95,
    });
    const { db } = deps({
      read: (async () => ({ extraction: wrong, model: "m", promptVersion: "v", latencyMs: 1 })) as never,
    });
    const out = await handleInboundImage(db, inbound());
    assert.equal(out.reason, "recipient_mismatch");
  });
});

describe("handleInboundImage — why a reading failed", () => {
  it("records the provider's own words, not just 'extraction_failed'", async () => {
    // A queue full of bare "extraction_failed" cannot tell a timeout from a
    // missing key, which is the only question worth asking about it.
    const { db, fake } = deps({
      read: (async () => {
        const { ReceiptReadError } = await import("./readReceipt.ts");
        throw new ReceiptReadError(
          "extraction_failed",
          "AI deadline reached after 3 model(s): 503; rate limited; timed out",
        );
      }) as never,
    });
    const out = await handleInboundImage(db, inbound());
    assert.equal(out.outcome, "review");
    assert.match(out.reason, /^extraction_failed: /);
    assert.match(out.reason, /deadline reached/);
    assert.equal(fake.insertsTo("deposit_receipts")[0].values.verdict, "unreadable");
  });

  it("does not repeat itself when the error says nothing extra", async () => {
    const { db } = deps({
      read: (async () => {
        const { ReceiptReadError } = await import("./readReceipt.ts");
        throw new ReceiptReadError("no_vision_model");
      }) as never,
    });
    assert.equal((await handleInboundImage(db, inbound())).reason, "no_vision_model");
  });
});

