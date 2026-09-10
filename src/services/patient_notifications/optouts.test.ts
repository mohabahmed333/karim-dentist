import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { isOptOutMessage } from "./optouts.ts";

describe("isOptOutMessage", () => {
  it("recognises the standard keyword in any case or punctuation", () => {
    for (const text of ["STOP", "stop", "Stop.", "  stop!  ", "🛑 STOP", "Unsubscribe"]) {
      assert.equal(isOptOutMessage(text), true, text);
    }
  });

  it("recognises Arabic opt-outs, with and without hamza", () => {
    for (const text of ["إيقاف", "ايقاف", "إلغاء الاشتراك", "الغاء الاشتراك", "إيقاف الرسائل"]) {
      assert.equal(isOptOutMessage(text), true, text);
    }
  });

  it("does not treat 'الغاء' as unsubscribing — it means cancel the appointment", () => {
    // A patient replying this to a reminder is cancelling a visit. Opting them
    // out of every future message would be a serious misreading.
    assert.equal(isOptOutMessage("الغاء"), false);
    assert.equal(isOptOutMessage("cancel"), false);
  });

  it("ignores 'stop' inside an ordinary sentence", () => {
    assert.equal(isOptOutMessage("can you stop the drilling noise next time"), false);
    assert.equal(isOptOutMessage("please don't stop the reminders"), false);
  });

  it("is false for empty or missing text", () => {
    assert.equal(isOptOutMessage(""), false);
    assert.equal(isOptOutMessage("   "), false);
    assert.equal(isOptOutMessage(null), false);
    assert.equal(isOptOutMessage("..."), false);
  });
});
