import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createCannedReplySchema,
  QUICK_REPLY_MAX_FILE_BYTES,
  updateCannedReplySchema,
  // @ts-expect-error -- Node strip-types needs the extension.
} from "./cannedReplyInput.ts";

const valid = { slash_key: "Visit", title: "Visit", body: "Hi {{name}}" };

describe("createCannedReplySchema", () => {
  it("lower-cases the slash key", () => {
    const parsed = createCannedReplySchema.parse(valid);
    assert.equal(parsed.slash_key, "visit");
  });

  it("rejects a slash key staff could not type after /", () => {
    assert.equal(createCannedReplySchema.safeParse({ ...valid, slash_key: "two words" }).success, false);
  });

  it("rejects an unknown fill-in field in either language", () => {
    const english = createCannedReplySchema.safeParse({ ...valid, body: "Hi {{nmae}}" });
    assert.equal(english.success, false);
    const arabic = createCannedReplySchema.safeParse({ ...valid, body_ar: "مرحبا {{nmae}}" });
    assert.equal(arabic.success, false);
    assert.deepEqual(arabic.error?.issues[0]?.path, ["body_ar"]);
  });

  it("accepts a clinic location attachment", () => {
    assert.equal(createCannedReplySchema.safeParse({ ...valid, attachment: { kind: "location" } }).success, true);
  });

  it("rejects a PDF passed off as an image", () => {
    const attachment = { kind: "image", mime: "application/pdf", path: "a.pdf", name: "a.pdf", size: 10 };
    assert.equal(createCannedReplySchema.safeParse({ ...valid, attachment }).success, false);
  });

  it("rejects files larger than the send route can carry", () => {
    const attachment = {
      kind: "document",
      mime: "application/pdf",
      path: "a.pdf",
      name: "a.pdf",
      size: QUICK_REPLY_MAX_FILE_BYTES + 1,
    };
    assert.equal(createCannedReplySchema.safeParse({ ...valid, attachment }).success, false);
  });
});

describe("updateCannedReplySchema", () => {
  it("refuses an empty update", () => {
    assert.equal(updateCannedReplySchema.safeParse({}).success, false);
  });

  it("allows switching a reply off on its own", () => {
    assert.deepEqual(updateCannedReplySchema.parse({ active: false }), { active: false });
  });

  it("still rejects unknown fields on edit", () => {
    assert.equal(updateCannedReplySchema.safeParse({ body: "{{coupon}}" }).success, false);
  });
});
