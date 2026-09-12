import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { attachmentPath, isDuplicateSlashKey, toCannedReplyPatch } from "./cannedReplies.ts";

const now = new Date("2026-09-11T10:00:00.000Z");

describe("toCannedReplyPatch", () => {
  it("only includes the keys the caller sent", () => {
    assert.deepEqual(toCannedReplyPatch({ active: false }, now), {
      active: false,
      updated_at: now.toISOString(),
    });
  });

  it("stores blank optional text as null", () => {
    const patch = toCannedReplyPatch({ title_ar: "  ", body_ar: "", category: " " }, now);
    assert.equal(patch.title_ar, null);
    assert.equal(patch.body_ar, null);
    assert.equal(patch.category, null);
  });

  it("clears the attachment when null is sent", () => {
    assert.equal(toCannedReplyPatch({ attachment: null }, now).attachment, null);
  });
});

describe("attachmentPath", () => {
  it("returns the storage path of a file attachment", () => {
    assert.equal(
      attachmentPath({ kind: "image", path: "a.png", mime: "image/png", name: "a.png", size: 1 }),
      "a.png",
    );
  });

  it("returns null for a location pin or nothing", () => {
    assert.equal(attachmentPath({ kind: "location" }), null);
    assert.equal(attachmentPath(null), null);
  });
});

describe("isDuplicateSlashKey", () => {
  it("recognises Postgres unique violations", () => {
    assert.equal(isDuplicateSlashKey({ code: "23505", message: "duplicate key" }), true);
    assert.equal(isDuplicateSlashKey({ code: "42501" }), false);
    assert.equal(isDuplicateSlashKey(new Error("x")), false);
  });
});

describe("toCannedReplyPatch buttons", () => {
  it("passes saved buttons through", () => {
    const buttons = [{ title: "Book now", title_ar: "احجز" }];
    assert.deepEqual(toCannedReplyPatch({ buttons }, now).buttons, buttons);
  });

  it("clears buttons when null is sent", () => {
    assert.equal(toCannedReplyPatch({ buttons: null }, now).buttons, null);
  });

  it("leaves buttons out when the caller didn't send them", () => {
    assert.equal("buttons" in toCannedReplyPatch({ active: false }, now), false);
  });
});
