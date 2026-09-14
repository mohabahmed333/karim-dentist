import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  claimsCompletedBooking,
  quotesMoney,
  isSendableReply,
  stripInternalIds,
} from "./replyGuards.ts";

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

describe("claimsCompletedBooking", () => {
  /**
   * The production failure this guard exists for. The bot told a patient
   * "تمام، حجزت لك موعد 11 سبتمبر الساعة 10:30" while booking writes were
   * disabled. No reservation was created and the slot stayed open, so the
   * patient believed they had an appointment that did not exist.
   */
  it("catches the Arabic claim that shipped to a real patient", () => {
    assert.equal(
      claimsCompletedBooking("تمام، حجزت لك موعد 11 سبتمبر الساعة 10:30."),
      true,
    );
  });

  it("catches Arabic booking, cancellation and reschedule claims", () => {
    for (const text of [
      "تم الحجز بنجاح",
      "حجزنا لك الموعد",
      "تم إلغاء موعدك",
      "تم تغيير موعدك إلى الخميس",
      "موعدك مؤكد يوم الأحد",
    ]) {
      assert.equal(claimsCompletedBooking(text), true, text);
    }
  });

  it("catches the English equivalents", () => {
    for (const text of [
      "I've booked you for Sunday at 2pm.",
      "You're booked in for Thursday.",
      "Your appointment is confirmed.",
      "Your appointment has been cancelled.",
      "I have rescheduled you to Monday.",
    ]) {
      assert.equal(claimsCompletedBooking(text), true, text);
    }
  });

  /**
   * Offering to book is the correct behaviour and must not be blocked, or the
   * assistant cannot hold a booking conversation at all.
   */
  it("does not fire on offers or questions", () => {
    for (const text of [
      "Would you like me to book Sunday at 2pm?",
      "Shall I confirm that time for you?",
      "هل تريد أن أحجز لك يوم الأحد؟",
      "تحب احجزلك الموعد ده؟",
      "I can book that for you — just confirm the service.",
      "Please confirm which service you would like.",
      "من فضلك أكد الخدمة المطلوبة",
    ]) {
      assert.equal(claimsCompletedBooking(text), false, text);
    }
  });

  it("does not fire on availability answers", () => {
    for (const text of [
      "المواعيد المتاحة هي: 11 سبتمبر 10:30، 14 سبتمبر 14:00.",
      "We have Sunday 10:30 and Thursday 14:00 free.",
      "We open at 10:00 and close at 18:00.",
    ]) {
      assert.equal(claimsCompletedBooking(text), false, text);
    }
  });
});

describe("claimsCompletedBooking — hamza-dropped spelling", () => {
  /**
   * The actual gap this closed: a model writing "تم التاكيد" instead of "تم
   * التأكيد" walked straight past the guard built specifically to stop a false
   * confirmation reaching a patient — the guard is only as good as the
   * spellings it recognises, and a model is as prone to dropping a hamza as a
   * patient typing one.
   */
  it("catches a completed claim spelled without the hamza", () => {
    for (const text of [
      "تمام، تم التاكيد.",
      "موعدك موكد.",
      "تم الالغاء بنجاح.",
      "الغينا الحجز.",
    ]) {
      assert.equal(claimsCompletedBooking(text), true, text);
    }
  });

  it("still reads a hamza-dropped offer as an offer, not a claim", () => {
    assert.equal(claimsCompletedBooking("تحب اكد الحجز؟"), false);
  });
});

/**
 * There is no price on a service row, so every figure the assistant produces
 * about money was invented — and a patient acts on a quoted price. The prompt
 * sends money to a person; this is the enforcement.
 */
describe("quotesMoney", () => {
  for (const reply of [
    "الكشف بـ 200 جنيه",
    "الكشف ٢٠٠ جنيه",
    "السعر 200 ج.م",
    "That will be 200 EGP",
    "The consultation is EGP 200",
    "It costs 350 LE",
    "الكشف والاستشارة 200 جنيه، تحب أحجزلك؟",
    "الكشف مجاني",
    "الاستشارة ببلاش",
  ]) {
    it(`refuses "${reply}"`, () => assert.equal(quotesMoney(reply), true));
  }

  /** The clarifying question the prompt now asks for must still go out. */
  for (const reply of [
    "تقصد عرض مجاني ولا الكشف نفسه؟",
    "هل تقصد استشارة مجانية؟",
    "Do you mean a free consultation, or the check-up itself?",
  ]) {
    it(`allows the clarifying question "${reply}"`, () =>
      assert.equal(quotesMoney(reply), false));
  }

  /**
   * The consultation fee is the one figure the server itself put in the
   * prompt. The clinic takes it up front to hold the chair, so it is both the
   * price of the كشف and the deposit that confirms the booking — and the
   * assistant may say it either way. Every other treatment has no price on
   * file, so a figure attached to one was invented.
   */
  describe("the consultation fee, which the server supplied", () => {
    const fee = { depositEgp: 200 };

    for (const reply of [
      "الكشف بـ 200 جنيه، بيتدفعوا مقدم عشان نأكد الميعاد",
      "الكشف بـ ٢٠٠ جنيه. تحب أحجزلك؟",
      "الاستشارة ٢٠٠ جنيه",
      "عشان نأكد الميعاد بناخد مقدم ٢٠٠ جنيه",
      "The consultation is 200 EGP, paid up front to confirm the appointment",
      "There is a deposit of 200 EGP to confirm the appointment",
    ]) {
      it(`allows "${reply}"`, () => assert.equal(quotesMoney(reply, fee), false));
    }

    /** Nothing on file prices a treatment, whatever figure it is given. */
    it("refuses the fee attached to a treatment instead", () => {
      assert.equal(quotesMoney("التقويم بـ 200 جنيه", fee), true);
      assert.equal(quotesMoney("The crown is 200 EGP", fee), true);
    });

    it("refuses a figure that is not the fee", () => {
      assert.equal(quotesMoney("الكشف بـ 350 جنيه", fee), true);
    });

    it("refuses a total built around the fee", () => {
      assert.equal(quotesMoney("الكشف 200 جنيه والباقي 300 جنيه", fee), true);
    });

    it("refuses any figure when no fee is configured", () => {
      assert.equal(quotesMoney("الكشف بـ 200 جنيه", {}), true);
      assert.equal(quotesMoney("الكشف بـ 200 جنيه", { depositEgp: 0 }), true);
    });
  });

  /** Ordinary booking talk is full of numbers and none of them are prices. */
  for (const reply of [
    "ميعادك الأربعاء 16 سبتمبر الساعة 1:30 م",
    "عندنا مواعيد الساعة 10:00 و 11:30",
    "تمام يا مهاب، سجلت عمرك 17 سنة",
    "Your appointment is on Wednesday at 1:30 pm",
    "أسعار العروض بيأكدها الفريق، تحب أحجزلك كشف؟",
  ]) {
    it(`allows "${reply}"`, () => assert.equal(quotesMoney(reply), false));
  }
});
