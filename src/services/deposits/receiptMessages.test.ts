import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  depositInstructions,
  formatEgp,
  receiptOutcomeMessage,
} from "./receiptMessages.ts";

describe("formatEgp", () => {
  it("writes whole pounds without decimals", () => {
    assert.equal(formatEgp(200, "en"), "EGP 200");
    assert.equal(formatEgp(200, "ar"), "200 جنيه");
  });

  it("keeps piastres when there are any", () => {
    assert.equal(formatEgp(199.5, "en"), "EGP 199.5");
  });

  it("uses Western digits in Arabic, as the rest of the app does", () => {
    // Egyptian patients read Latin digits for money; Arabic-Indic would be a
    // surprise here and makes an amount harder to compare against a receipt.
    assert.match(formatEgp(1500, "ar"), /1,500/);
  });
});

describe("depositInstructions", () => {
  const base = {
    amountEgp: 200,
    instapayHandle: "clinic@instapay",
    walletNumber: "01005551234",
    holdMinutes: 30,
    language: "en" as const,
  };

  it("names the amount, both destinations and the hold", () => {
    const text = depositInstructions(base);
    assert.match(text, /EGP 200/);
    assert.match(text, /clinic@instapay/);
    assert.match(text, /01005551234/);
    assert.match(text, /30 minutes/);
  });

  it("writes the Arabic version with the same facts", () => {
    const text = depositInstructions({ ...base, language: "ar" });
    assert.match(text, /200 جنيه/);
    assert.match(text, /clinic@instapay/);
    assert.match(text, /30 دقيقة/);
  });

  it("omits a destination the clinic has not configured", () => {
    const text = depositInstructions({ ...base, walletNumber: "" });
    assert.match(text, /clinic@instapay/);
    assert.doesNotMatch(text, /—/);
  });

  it("still reads as a sentence when no destination is configured at all", () => {
    const text = depositInstructions({ ...base, instapayHandle: "", walletNumber: "" });
    assert.match(text, /EGP 200/);
    assert.doesNotMatch(text, /Transfer to:/);
  });
});

describe("receiptOutcomeMessage", () => {
  const base = { language: "en" as const, amountEgp: 200 };

  it("confirms plainly", () => {
    assert.match(receiptOutcomeMessage({ ...base, reason: "ok" }), /confirmed/);
  });

  it("tells the patient exactly what is still owed", () => {
    const text = receiptOutcomeMessage({ ...base, reason: "amount_short", paidEgp: 150 });
    assert.match(text, /EGP 150/);
    assert.match(text, /EGP 200/);
    assert.match(text, /EGP 50/);
  });

  it("handles a short amount it could not quantify", () => {
    const text = receiptOutcomeMessage({ ...base, reason: "amount_short" });
    assert.match(text, /less than the EGP 200 deposit/);
  });

  it("never reports a negative remainder", () => {
    const text = receiptOutcomeMessage({ ...base, reason: "amount_short", paidEgp: 500 });
    assert.match(text, /EGP 0/);
  });

  it("says a duplicate was already received, without accusing anyone", () => {
    const text = receiptOutcomeMessage({ ...base, reason: "duplicate_image" });
    assert.match(text, /already received/);
    assert.doesNotMatch(text, /fraud|fake|refus/i);
  });

  it("asks again for a wrong picture", () => {
    assert.match(
      receiptOutcomeMessage({ ...base, reason: "not_a_receipt" }),
      /doesn't look like a transfer receipt/,
    );
  });

  it("explains an expired hold", () => {
    assert.match(receiptOutcomeMessage({ ...base, reason: "hold_expired" }), /released/);
  });

  for (const reason of [
    "low_confidence",
    "recipient_mismatch",
    "timestamp_unreadable",
    "manual_review_mode",
    "no_vision_model",
    "something_new_nobody_wrote_a_message_for",
  ]) {
    it(`falls back to "a colleague is checking" for ${reason}`, () => {
      // The safe default: true about an unclear case, and never a claim that
      // the money was refused.
      const text = receiptOutcomeMessage({ ...base, reason });
      assert.match(text, /colleague is checking/);
      assert.match(text, /still held/);
    });
  }

  it("has an Arabic version of every outcome", () => {
    for (const reason of ["ok", "amount_short", "duplicate_image", "not_a_receipt", "hold_expired", "low_confidence"]) {
      const text = receiptOutcomeMessage({ reason, language: "ar", amountEgp: 200, paidEgp: 100 });
      assert.match(text, /[؀-ۿ]/, reason);
    }
  });
});
