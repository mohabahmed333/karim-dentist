import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { localizeQuickReply, matchesQuickReply, sortQuickReplies } from "./quickReplyMenu.ts";

const reply = (id: string, use_count: number, sort_order: number, extra = {}) => ({
  id,
  slash_key: id,
  title: `Title ${id}`,
  body: "Body",
  use_count,
  sort_order,
  ...extra,
});

describe("sortQuickReplies", () => {
  it("lists the most used replies first", () => {
    const sorted = sortQuickReplies([reply("a", 1, 10), reply("b", 9, 20), reply("c", 4, 30)]);
    assert.deepEqual(sorted.map((r: { id: string }) => r.id), ["b", "c", "a"]);
  });

  it("keeps the staff-set order between replies used equally often", () => {
    const sorted = sortQuickReplies([reply("late", 0, 50), reply("early", 0, 10)]);
    assert.deepEqual(sorted.map((r: { id: string }) => r.id), ["early", "late"]);
  });

  it("does not reorder the array it was given", () => {
    const input = [reply("a", 0, 2), reply("b", 5, 1)];
    sortQuickReplies(input);
    assert.equal(input[0].id, "a");
  });
});

describe("matchesQuickReply", () => {
  it("matches everything for an empty query", () => {
    assert.equal(matchesQuickReply(reply("a", 0, 0), "  "), true);
  });

  it("matches the category", () => {
    assert.equal(matchesQuickReply(reply("a", 0, 0, { category: "Booking" }), "book"), true);
  });

  it("matches the Arabic title", () => {
    assert.equal(matchesQuickReply(reply("a", 0, 0, { title_ar: "حجز موعد" }), "حجز"), true);
  });

  it("does not match unrelated text", () => {
    assert.equal(matchesQuickReply(reply("a", 0, 0), "parking"), false);
  });
});

describe("localizeQuickReply", () => {
  const bilingual = {
    id: "v",
    slash_key: "visit",
    title: "Reminder",
    title_ar: "تذكير",
    body: "See you soon",
    body_ar: "نراكم قريباً",
  };

  it("uses the Arabic text, with Arabic fill-ins, in an Arabic chat", () => {
    assert.deepEqual(localizeQuickReply(bilingual, "ar"), {
      title: "تذكير",
      body: "نراكم قريباً",
      locale: "ar",
    });
  });

  it("falls back to the English body, with English fill-ins, when the Arabic body is blank", () => {
    for (const body_ar of ["", "   ", null]) {
      const result = localizeQuickReply({ ...bilingual, body_ar }, "ar");
      assert.equal(result.body, "See you soon");
      assert.equal(result.locale, "en");
    }
  });

  it("fills in Arabic when an Arabic reply was saved in the English column", () => {
    const result = localizeQuickReply({ ...bilingual, body: "أهلاً بكم", body_ar: null }, "en");
    assert.equal(result.body, "أهلاً بكم");
    assert.equal(result.locale, "ar");
  });

  it("falls back to the English title on the same rule", () => {
    assert.equal(localizeQuickReply({ ...bilingual, title_ar: "  " }, "ar").title, "Reminder");
    assert.equal(localizeQuickReply(bilingual, "en").title, "Reminder");
  });

  it("trims what it returns and defaults to English fill-ins when the body has no letters", () => {
    assert.deepEqual(localizeQuickReply({ ...bilingual, title: " Hi ", body: " 10:30 " }, "en"), {
      title: "Hi",
      body: "10:30",
      locale: "en",
    });
    assert.equal(localizeQuickReply({ ...bilingual, body: "10:30", body_ar: null }, "ar").locale, "en");
  });
});
