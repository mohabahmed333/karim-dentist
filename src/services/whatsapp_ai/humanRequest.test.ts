import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { showsFrustration, wantsHuman } from "./humanRequest.ts";

describe("wantsHuman", () => {
  it("recognises Egyptian Arabic requests for a person", () => {
    for (const text of [
      "عايز موظف",
      "ممكن اكلم حد؟",
      "انسان حقيقي من فضلك",
      "عايز خدمة العملاء",
      "مش عايز بوت",
      "مش عايز اتكلم مع روبوت",
      "كلمني بشري",
    ]) {
      assert.equal(wantsHuman(text), true, text);
    }
  });

  it("recognises English requests for a person", () => {
    for (const text of [
      "Can I talk to a human?",
      "I want a real person",
      "Is there an agent available",
      "speak to someone please",
      "you're not a bot are you",
    ]) {
      assert.equal(wantsHuman(text), true, text);
    }
  });

  /** Booking with the doctor is a booking, not a request to leave the bot. */
  it("does not fire on ordinary booking messages", () => {
    for (const text of [
      "عايز احجز ميعاد",
      "عايز احجز مع الدكتور",
      "What time do you open?",
      "Can I book with the doctor?",
      "تنظيف اسنان",
    ]) {
      assert.equal(wantsHuman(text), false, text);
    }
  });
});

describe("showsFrustration", () => {
  /** The real transcript had a patient send "؟؟" after being ignored. */
  it("recognises repeated question marks and not being understood", () => {
    for (const text of ["؟؟", "??", "انت مش فاهم", "مش فاهم حاجة", "this is useless"]) {
      assert.equal(showsFrustration(text), true, text);
    }
  });

  it("does not fire on a normal question", () => {
    for (const text of ["What time do you open?", "فاهم، شكرا", "تمام؟"]) {
      assert.equal(showsFrustration(text), false, text);
    }
  });
});
