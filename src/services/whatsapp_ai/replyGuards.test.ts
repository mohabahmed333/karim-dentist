import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { isSendableReply, stripInternalIds } from "./replyGuards.ts";

describe("stripInternalIds", () => {
  /** The exact message a patient received in production. */
  it("removes slot ids from the Arabic availability reply", () => {
    const leaked =
      "المواعيد المتاحة: 11‑سبتمبر 10:30 (slotId=5fc6aa5c-6891-4c35-bcbd-df178d028ded)، " +
      "11‑سبتمبر 14:00 (slotId=051045bf-3ae4-4769-add9-a28135309b46).";
    const { reply, violations } = stripInternalIds(leaked);

    assert.ok(!/slotId/i.test(reply), "slotId label must be gone");
    assert.ok(!/[0-9a-f]{8}-[0-9a-f]{4}/i.test(reply), "no uuid may remain");
    assert.equal(violations.length, 2);
    // The useful content survives.
    assert.match(reply, /11‑سبتمبر 10:30/);
    assert.match(reply, /11‑سبتمبر 14:00/);
    assert.ok(!reply.includes("()"), "no empty brackets left behind");
  });

  it("removes a bare uuid with no label", () => {
    const { reply, violations } = stripInternalIds(
      "Your booking 5fc6aa5c-6891-4c35-bcbd-df178d028ded is confirmed.",
    );
    assert.ok(!/[0-9a-f]{8}-/i.test(reply));
    assert.equal(violations.length, 1);
    assert.match(reply, /Your booking/);
    assert.match(reply, /is confirmed/);
  });

  it("handles the English bracketed form and other id labels", () => {
    for (const text of [
      "Sunday 2pm (slotId: 5fc6aa5c-6891-4c35-bcbd-df178d028ded)",
      "Sunday 2pm [slot_id=5fc6aa5c-6891-4c35-bcbd-df178d028ded]",
      "Moved reservationId=5fc6aa5c-6891-4c35-bcbd-df178d028ded for you",
    ]) {
      const { reply } = stripInternalIds(text);
      assert.ok(!/[0-9a-f]{8}-[0-9a-f]{4}/i.test(reply), text);
      assert.ok(!/id\s*[:=]/i.test(reply), text);
    }
  });

  it("leaves a clean reply completely untouched", () => {
    for (const clean of [
      "We open at 10:00 and close at 18:00, Sunday to Thursday.",
      "العيادة مفتوحة من الأحد إلى الخميس من 10:00 إلى 18:00",
      "We have Sunday 10:30 and Sunday 14:00 available.",
    ]) {
      const { reply, violations } = stripInternalIds(clean);
      assert.equal(reply, clean);
      assert.deepEqual(violations, []);
    }
  });

  it("does not mistake ordinary numbers or times for identifiers", () => {
    const text = "Your appointment on 11-09-2026 at 14:00 costs 800 EGP.";
    assert.equal(stripInternalIds(text).reply, text);
  });

  it("tidies punctuation stranded by the removal", () => {
    const { reply } = stripInternalIds(
      "Times: 10:30 (slotId=5fc6aa5c-6891-4c35-bcbd-df178d028ded) , 14:00 .",
    );
    assert.ok(!reply.includes(" ,"), "no space before comma");
    assert.ok(!reply.includes("  "), "no double spaces");
    assert.ok(!reply.includes(" ."), "no space before full stop");
  });
});

describe("isSendableReply", () => {
  it("accepts a reply with real words", () => {
    assert.equal(isSendableReply("We open at 10am."), true);
    assert.equal(isSendableReply("العيادة مفتوحة"), true);
  });

  /** Stripping can leave punctuation, which is worse than staying silent. */
  it("rejects a reply that is only punctuation or fragments", () => {
    assert.equal(isSendableReply(""), false);
    assert.equal(isSendableReply("   "), false);
    assert.equal(isSendableReply("(), ."), false);
    assert.equal(isSendableReply("- ,"), false);
  });
});
