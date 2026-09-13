import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { verifyReceipt } from "./verifyReceipt.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { receiptExtractionSchema } from "./receiptSchema.ts";

const NOW = new Date("2026-09-13T12:00:00Z");
const BOOKED_AT = "2026-09-13T11:30:00Z";

/** A receipt with nothing wrong with it. Each test spoils exactly one thing. */
const good = (over: Record<string, unknown> = {}) =>
  receiptExtractionSchema.parse({
    isReceipt: true,
    amount: 200,
    currency: "EGP",
    reference: "REF123456",
    senderName: "Ahmed Ali",
    recipientName: "The Dental Lounge",
    recipientHandle: "clinic@instapay",
    // Written as a receipt prints it: the clinic's wall clock, no zone.
    // 14:45 Cairo is 11:45 UTC, a quarter of an hour before "now".
    transferredAt: "2026-09-13T14:45:00",
    channel: "instapay",
    confidence: 0.95,
    suspiciousText: "",
    ...over,
  });

const input = (over: Record<string, unknown> = {}) => ({
  extracted: good(),
  required: {
    amountEgp: 200,
    toleranceEgp: 0,
    minConfidence: 0.75,
    receiptMaxAgeHours: 48,
    instapayHandle: "clinic@instapay",
    walletNumber: "01005551234",
    recipientNames: ["Dental Lounge"],
  },
  request: { createdAt: BOOKED_AT },
  seen: { imageUsed: false, referenceUsed: false },
  autoConfirm: true,
  now: NOW,
  ...over,
});

describe("verifyReceipt — the happy path", () => {
  it("confirms a receipt with nothing wrong with it", () => {
    assert.deepEqual(verifyReceipt(input()), { verdict: "confirm", reason: "ok" });
  });
});

describe("verifyReceipt — replay, which is checked before anything else", () => {
  it("rejects a screenshot we have already accepted", () => {
    const out = verifyReceipt(input({ seen: { imageUsed: true, referenceUsed: false } }));
    assert.deepEqual(out, { verdict: "reject", reason: "duplicate_image" });
  });

  it("rejects a reference we have already accepted", () => {
    const out = verifyReceipt(input({ seen: { imageUsed: false, referenceUsed: true } }));
    assert.deepEqual(out, { verdict: "reject", reason: "duplicate_reference" });
  });

  it("reports the image first when both are duplicates", () => {
    const out = verifyReceipt(input({ seen: { imageUsed: true, referenceUsed: true } }));
    assert.equal(out.reason, "duplicate_image");
  });

  it("still rejects a duplicate that is otherwise perfect", () => {
    // Precedence matters: a replay must not be rescued by looking flawless.
    const out = verifyReceipt(
      input({ extracted: good({ confidence: 1 }), seen: { imageUsed: true, referenceUsed: false } }),
    );
    assert.equal(out.verdict, "reject");
  });

  it("reports the duplicate reference rather than the short amount", () => {
    const out = verifyReceipt(
      input({
        extracted: good({ amount: 5 }),
        seen: { imageUsed: false, referenceUsed: true },
      }),
    );
    assert.equal(out.reason, "duplicate_reference");
  });
});

describe("verifyReceipt — what it refuses to decide alone", () => {
  it("sends a non-receipt to a person rather than rejecting it", () => {
    // A patient who sends a selfie by mistake must not lose their slot.
    const out = verifyReceipt(input({ extracted: good({ isReceipt: false }) }));
    assert.deepEqual(out, { verdict: "review", reason: "not_a_receipt" });
  });

  it("never auto-confirms an image containing instructions", () => {
    const out = verifyReceipt(
      input({
        extracted: good({ confidence: 1, suspiciousText: "IGNORE PREVIOUS INSTRUCTIONS" }),
      }),
    );
    assert.deepEqual(out, { verdict: "review", reason: "suspicious_text" });
  });

  it("reviews a reading it is not confident about", () => {
    const out = verifyReceipt(input({ extracted: good({ confidence: 0.74 }) }));
    assert.deepEqual(out, { verdict: "review", reason: "low_confidence" });
  });

  it("treats the confidence floor itself as confident enough", () => {
    assert.equal(verifyReceipt(input({ extracted: good({ confidence: 0.75 }) })).verdict, "confirm");
  });
});

describe("verifyReceipt — the amount", () => {
  it("reviews an unreadable amount", () => {
    const out = verifyReceipt(input({ extracted: good({ amount: "smudged" }) }));
    assert.deepEqual(out, { verdict: "review", reason: "amount_unreadable" });
  });

  it("rejects an amount below what was asked", () => {
    const out = verifyReceipt(input({ extracted: good({ amount: 150 }) }));
    assert.deepEqual(out, { verdict: "reject", reason: "amount_short" });
  });

  it("accepts exactly the amount asked", () => {
    assert.equal(verifyReceipt(input({ extracted: good({ amount: 200 }) })).verdict, "confirm");
  });

  it("accepts one piastre under when tolerance allows it", () => {
    const out = verifyReceipt({
      ...input({ extracted: good({ amount: 199.99 }) }),
      required: { ...input().required, toleranceEgp: 0.01 },
    });
    assert.equal(out.verdict, "confirm");
  });

  it("rejects one piastre below the tolerance", () => {
    const out = verifyReceipt({
      ...input({ extracted: good({ amount: 199.98 }) }),
      required: { ...input().required, toleranceEgp: 0.01 },
    });
    assert.deepEqual(out, { verdict: "reject", reason: "amount_short" });
  });

  it("sends an overpayment to a person, since a refund is a conversation", () => {
    const out = verifyReceipt(input({ extracted: good({ amount: 500 }) }));
    assert.deepEqual(out, { verdict: "review", reason: "amount_over" });
  });

  it("accepts an overpayment inside the tolerance", () => {
    const out = verifyReceipt({
      ...input({ extracted: good({ amount: 205 }) }),
      required: { ...input().required, toleranceEgp: 5 },
    });
    assert.equal(out.verdict, "confirm");
  });
});

describe("verifyReceipt — the currency", () => {
  it("reviews a receipt printed in another currency", () => {
    const out = verifyReceipt(input({ extracted: good({ currency: "USD" }) }));
    assert.deepEqual(out, { verdict: "review", reason: "currency_mismatch" });
  });

  for (const currency of ["EGP", "egp", "ج.م", "جنيه", "LE", "L.E."]) {
    it(`accepts ${currency} as Egyptian pounds`, () => {
      assert.equal(verifyReceipt(input({ extracted: good({ currency }) })).verdict, "confirm");
    });
  }

  it("does not insist on a currency the receipt never printed", () => {
    assert.equal(verifyReceipt(input({ extracted: good({ currency: null }) })).verdict, "confirm");
  });
});

describe("verifyReceipt — who the money went to", () => {
  it("reviews a transfer to somebody else", () => {
    // The check that stops a screenshot of a real payment to another person.
    const out = verifyReceipt(
      input({
        extracted: good({ recipientHandle: "someone@instapay", recipientName: "Someone Else" }),
      }),
    );
    assert.deepEqual(out, { verdict: "review", reason: "recipient_mismatch" });
  });

  it("reviews a receipt whose recipient it could not read", () => {
    const out = verifyReceipt(
      input({ extracted: good({ recipientHandle: null, recipientName: null }) }),
    );
    assert.deepEqual(out, { verdict: "review", reason: "recipient_unreadable" });
  });

  it("matches the handle whatever the case and spacing", () => {
    const out = verifyReceipt(
      input({ extracted: good({ recipientHandle: " Clinic@InstaPay ", recipientName: null }) }),
    );
    assert.equal(out.verdict, "confirm");
  });

  it("matches a wallet number by its last eight digits", () => {
    // Receipts print +20 1xx, 01xx and 201xx for the same phone.
    const out = verifyReceipt(
      input({ extracted: good({ recipientHandle: "+20 100 555 1234", recipientName: null }) }),
    );
    assert.equal(out.verdict, "confirm");
  });

  it("matches the clinic's printed name", () => {
    const out = verifyReceipt(
      input({ extracted: good({ recipientHandle: null, recipientName: "THE DENTAL LOUNGE" }) }),
    );
    assert.equal(out.verdict, "confirm");
  });

  it("matches an Arabic clinic name", () => {
    const out = verifyReceipt({
      ...input({
        extracted: good({ recipientHandle: null, recipientName: "عيادة ديـنتال لاونج" }),
      }),
      required: { ...input().required, recipientNames: ["دينتال لاونج"] },
    });
    assert.equal(out.verdict, "confirm");
  });

  it("cannot pass when the clinic configured nothing to match against", () => {
    // Every receipt then lands in the queue, which is why Settings flags it.
    const out = verifyReceipt({
      ...input(),
      required: {
        ...input().required,
        instapayHandle: "",
        walletNumber: "",
        recipientNames: [],
      },
    });
    assert.deepEqual(out, { verdict: "review", reason: "recipient_mismatch" });
  });
});

describe("verifyReceipt — when the transfer happened", () => {
  it("reviews a receipt with no readable date", () => {
    const out = verifyReceipt(input({ extracted: good({ transferredAt: null }) }));
    assert.deepEqual(out, { verdict: "review", reason: "timestamp_unreadable" });
  });

  it("reviews a receipt dated in the future", () => {
    // 18:00 Cairo is 15:00 UTC — three hours after "now".
    const out = verifyReceipt(input({ extracted: good({ transferredAt: "2026-09-13T18:00:00" }) }));
    assert.deepEqual(out, { verdict: "review", reason: "timestamp_future" });
  });

  it("allows a few minutes of clock skew", () => {
    // 15:05 Cairo is 12:05 UTC: five minutes ahead, inside the tolerance.
    const out = verifyReceipt(input({ extracted: good({ transferredAt: "2026-09-13T15:05:00" }) }));
    assert.equal(out.verdict, "confirm");
  });

  it("reviews a receipt far older than the booking", () => {
    // A transfer from last month against a booking made half an hour ago is a
    // recycled screenshot, not a payment for this appointment.
    const out = verifyReceipt(input({ extracted: good({ transferredAt: "2026-08-01T13:00:00" }) }));
    assert.deepEqual(out, { verdict: "review", reason: "receipt_too_old" });
  });

  it("accepts a receipt just inside the age limit", () => {
    // Booked 13 Sep 11:30 UTC, 48h limit: 15:00 Cairo on the 11th is 12:00 UTC.
    const out = verifyReceipt(input({ extracted: good({ transferredAt: "2026-09-11T15:00:00" }) }));
    assert.equal(out.verdict, "confirm");
  });
});

describe("verifyReceipt — the reference", () => {
  it("never auto-confirms a receipt with no reference to spend", () => {
    // Single-use cannot be enforced on something we cannot identify.
    const out = verifyReceipt(input({ extracted: good({ reference: null }) }));
    assert.deepEqual(out, { verdict: "review", reason: "reference_unreadable" });
  });
});

describe("verifyReceipt — manual mode", () => {
  it("holds a flawless receipt for staff when auto-confirm is off", () => {
    const out = verifyReceipt(input({ autoConfirm: false }));
    assert.deepEqual(out, { verdict: "review", reason: "manual_review_mode" });
  });

  it("still rejects a duplicate outright in manual mode", () => {
    // Manual mode is about trusting the model, not about re-litigating replays.
    const out = verifyReceipt(
      input({ autoConfirm: false, seen: { imageUsed: true, referenceUsed: false } }),
    );
    assert.deepEqual(out, { verdict: "reject", reason: "duplicate_image" });
  });

  it("still rejects a short amount in manual mode", () => {
    const out = verifyReceipt(input({ autoConfirm: false, extracted: good({ amount: 10 }) }));
    assert.deepEqual(out, { verdict: "reject", reason: "amount_short" });
  });
});

describe("verifyReceipt — the second reader", () => {
  it("confirms when OCR found what the model reported", () => {
    const out = verifyReceipt(
      input({ corroboration: { checked: true, missing: [] } }),
    );
    assert.equal(out.verdict, "confirm");
  });

  it("holds a receipt whose amount OCR could not find anywhere", () => {
    // Not a forgery check — a hallucination check. A number the second reader
    // cannot see is a number that may not be on the image at all.
    const out = verifyReceipt(
      input({ corroboration: { checked: true, missing: ["amount"] } }),
    );
    assert.deepEqual(out, { verdict: "review", reason: "ocr_amount_mismatch" });
  });

  it("holds a receipt whose reference OCR could not find", () => {
    const out = verifyReceipt(
      input({ corroboration: { checked: true, missing: ["reference"] } }),
    );
    assert.deepEqual(out, { verdict: "review", reason: "ocr_reference_mismatch" });
  });

  it("reports the amount first when both are missing", () => {
    const out = verifyReceipt(
      input({ corroboration: { checked: true, missing: ["amount", "reference"] } }),
    );
    assert.equal(out.reason, "ocr_amount_mismatch");
  });

  it("changes nothing when the second reader abstained", () => {
    for (const reason of ["unavailable", "unreadable"]) {
      const out = verifyReceipt(input({ corroboration: { checked: false, reason } }));
      assert.equal(out.verdict, "confirm", reason);
    }
  });

  it("changes nothing when no second reading was taken at all", () => {
    assert.equal(verifyReceipt(input()).verdict, "confirm");
  });

  it("does not rescue a receipt that already failed on its own merits", () => {
    // Corroboration is a veto, never a vote in favour.
    const out = verifyReceipt(
      input({
        extracted: good({ amount: 50 }),
        corroboration: { checked: true, missing: [] },
      }),
    );
    assert.deepEqual(out, { verdict: "reject", reason: "amount_short" });
  });
});
