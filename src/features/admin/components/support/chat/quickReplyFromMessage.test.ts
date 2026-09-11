import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { quickReplyFromMessage } from "./quickReplyFromMessage.ts";

const form = { slashKey: " Parking ", title: " Parking ", category: " " };

describe("quickReplyFromMessage", () => {
  it("files an English message under the English body only", () => {
    const payload = quickReplyFromMessage("  Free parking under the building. ", form);
    assert.equal(payload.body, "Free parking under the building.");
    assert.equal(payload.body_ar, null);
  });

  it("files an Arabic message under both bodies, since English is required", () => {
    const payload = quickReplyFromMessage("يوجد جراج مجاني أسفل المبنى.", form);
    assert.equal(payload.body_ar, "يوجد جراج مجاني أسفل المبنى.");
    assert.equal(payload.body, "يوجد جراج مجاني أسفل المبنى.");
  });

  it("normalises the key, trims the title and stores a blank category as null", () => {
    const payload = quickReplyFromMessage("x", form);
    assert.equal(payload.slash_key, "parking");
    assert.equal(payload.title, "Parking");
    assert.equal(payload.category, null);
  });
});
