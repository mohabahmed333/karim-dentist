import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { extractAutoReplyEnvelope } from "./extractAutoReplyEnvelope.ts";

const base = {
  intent: "booking_request",
  confidence: 0.9,
  reply: "Which time suits you?",
};

describe("envelope.collected", () => {
  it("passes reported booking details through", () => {
    const { envelope } = extractAutoReplyEnvelope(
      JSON.stringify({ ...base, collected: { service: "Cleaning", patientName: "Ali" } }),
    );
    assert.equal(envelope.handoff, false);
    assert.equal(envelope.collected.service, "Cleaning");
    assert.equal(envelope.collected.patientName, "Ali");
  });

  it("defaults to empty when the model omits it", () => {
    const { envelope } = extractAutoReplyEnvelope(JSON.stringify(base));
    assert.deepEqual(envelope.collected, {});
    assert.equal(envelope.handoff, false);
  });

  /**
   * A malformed optional field must not cost the patient their reply. Without
   * .catch, one wrong type here would turn a good answer into a handoff.
   */
  it("never fails a whole reply over a malformed collected field", () => {
    for (const collected of [null, "garbage", 42, [], { service: 7 }, { slotId: {} }]) {
      const { envelope } = extractAutoReplyEnvelope(JSON.stringify({ ...base, collected }));
      assert.equal(envelope.handoff, false, JSON.stringify(collected));
      assert.equal(envelope.reply, base.reply);
      assert.deepEqual(envelope.collected, {}, JSON.stringify(collected));
    }
  });

  it("accepts nulls for unknown fields", () => {
    const { envelope } = extractAutoReplyEnvelope(
      JSON.stringify({ ...base, collected: { service: "Cleaning", patientName: null, slotId: null } }),
    );
    assert.equal(envelope.collected.service, "Cleaning");
    assert.equal(envelope.handoff, false);
  });
});
