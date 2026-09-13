import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { isStorableRating, needsCall, recordVisitRating } from "./visitRatings.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "@/services/admin_ai/testing/fakeDb.ts";

const input = (over: Record<string, unknown> = {}) => ({
  conversationId: "conv-1",
  reservationId: "res-1",
  messageId: "msg-1",
  phone: "01005551234",
  rating: 5,
  comment: "ممتاز",
  ...over,
});

describe("isStorableRating", () => {
  it("accepts whole numbers on the scale", () => {
    for (const n of [1, 2, 3, 4, 5]) assert.equal(isStorableRating(n), true);
  });

  it("refuses anything else, rather than coercing it", () => {
    for (const n of [0, 6, 10, -1, 4.5, null, undefined, Number.NaN]) {
      assert.equal(isStorableRating(n as never), false, String(n));
    }
  });
});

describe("needsCall", () => {
  it("is the bottom three", () => {
    assert.deepEqual([1, 2, 3, 4, 5].map(needsCall), [true, true, true, false, false]);
  });
});

describe("recordVisitRating", () => {
  it("stores a score, flagging a low one for a call", async () => {
    const db = createFakeDb();
    assert.equal(await recordVisitRating(db as never, input({ rating: 2 })), true);
    const [write] = db.upsertsTo("visit_ratings");
    assert.equal(write.values.rating, 2);
    assert.equal(write.values.needs_call, true);
    assert.equal(write.values.message_id, "msg-1");
  });

  it("does not flag a good score", async () => {
    const db = createFakeDb();
    await recordVisitRating(db as never, input({ rating: 4 }));
    assert.equal(db.upsertsTo("visit_ratings")[0].values.needs_call, false);
  });

  it("writes nothing when the message carried no score", async () => {
    // Most messages are not ratings; this runs on all of them.
    const db = createFakeDb();
    assert.equal(await recordVisitRating(db as never, input({ rating: null })), false);
    assert.equal(db.upsertsTo("visit_ratings").length, 0);
  });

  it("writes nothing for a score off the scale", async () => {
    const db = createFakeDb();
    await recordVisitRating(db as never, input({ rating: 9 }));
    assert.equal(db.upsertsTo("visit_ratings").length, 0);
  });

  it("keys on the message so a redelivered webhook cannot double-count", async () => {
    const db = createFakeDb();
    await recordVisitRating(db as never, input());
    assert.equal(db.upsertsTo("visit_ratings").length, 1);
  });

  it("reports failure instead of throwing — a rating never costs a reply", async () => {
    const db = createFakeDb({ failOn: { "visit_ratings.upsert": { message: "nope" } } });
    assert.equal(await recordVisitRating(db as never, input()), false);
  });

  it("truncates a very long comment rather than refusing it", async () => {
    const db = createFakeDb();
    await recordVisitRating(db as never, input({ comment: "ا".repeat(5000) }));
    assert.equal(String(db.upsertsTo("visit_ratings")[0].values.comment).length, 2000);
  });
});
