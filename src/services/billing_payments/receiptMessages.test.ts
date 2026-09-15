import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { billingPaymentInstructions, billingReceiptOutcomeMessage } from "./receiptMessages.ts";

describe("billingPaymentInstructions", () => {
  it("states the amount, description, and where to pay", () => {
    const text = billingPaymentInstructions({
      amountEgp: 1500,
      description: "Root canal",
      instapayHandle: "clinic@instapay",
      walletNumber: "01005551234",
      language: "en",
    });
    assert.match(text, /EGP 1,500/);
    assert.match(text, /Root canal/);
    assert.match(text, /clinic@instapay/);
    assert.match(text, /01005551234/);
  });

  it("omits an unset destination", () => {
    const text = billingPaymentInstructions({
      amountEgp: 500,
      description: "Filling",
      instapayHandle: "",
      walletNumber: "01005551234",
      language: "en",
    });
    assert.doesNotMatch(text, /Transfer to: —/);
    assert.match(text, /01005551234/);
  });

  it("renders in Arabic", () => {
    const text = billingPaymentInstructions({
      amountEgp: 1500,
      description: "حشو",
      instapayHandle: "clinic@instapay",
      walletNumber: "",
      language: "ar",
    });
    assert.match(text, /جنيه/);
    assert.match(text, /حشو/);
  });
});

describe("billingReceiptOutcomeMessage", () => {
  it("confirms on 'ok'", () => {
    const text = billingReceiptOutcomeMessage({ reason: "ok", language: "en", amountEgp: 1500 });
    assert.match(text, /received/i);
  });

  it("quantifies a shortfall", () => {
    const text = billingReceiptOutcomeMessage({
      reason: "amount_short",
      language: "en",
      amountEgp: 1500,
      paidEgp: 1000,
    });
    assert.match(text, /EGP 1,000/);
    assert.match(text, /EGP 500/);
  });

  it("falls back to the review message for an unrecognised reason", () => {
    const text = billingReceiptOutcomeMessage({
      reason: "some_new_reason",
      language: "en",
      amountEgp: 1500,
    });
    assert.match(text, /checking/i);
  });
});
