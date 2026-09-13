import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { selectFollowups, selectRecalls, selectReviewRequests } from "./followupsAndRecalls.ts";

const NOW = new Date("2026-09-11T10:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();
const daysAgo = (d: number) => hoursAgo(d * 24);

const visit = (over: Record<string, unknown> = {}) => ({
  id: "r1",
  phone: "+201005551234",
  patient_name: "Ahmed",
  service_label: "Cleaning",
  starts_at: hoursAgo(24),
  status: "completed",
  ...over,
});

describe("selectFollowups", () => {
  it("follows up the day after a completed visit", () => {
    const out = selectFollowups([visit()], NOW);
    assert.equal(out.length, 1);
    assert.equal(out[0].kind, "followup");
    assert.equal(out[0].dedupe_key, "r1:followup");
  });

  it("waits until the patient is plausibly home", () => {
    assert.equal(selectFollowups([visit({ starts_at: hoursAgo(3) })], NOW).length, 0);
  });

  it("does not follow up days later, when it would read as an afterthought", () => {
    assert.equal(selectFollowups([visit({ starts_at: daysAgo(5) })], NOW).length, 0);
  });

  it("only follows up visits that actually happened", () => {
    for (const status of ["no_show", "cancelled", "confirmed", "pending"]) {
      assert.equal(selectFollowups([visit({ status })], NOW).length, 0, status);
    }
  });
});

describe("selectRecalls", () => {
  it("recalls a patient whose last completed visit was over six months ago", () => {
    const out = selectRecalls([visit({ starts_at: daysAgo(200) })], new Set(), NOW);
    assert.equal(out.length, 1);
    assert.equal(out[0].kind, "recall_6m");
  });

  it("judges by the most recent visit, not any old one", () => {
    // Seen a year ago and again last month: not lapsed.
    const out = selectRecalls(
      [
        visit({ id: "old", starts_at: daysAgo(365) }),
        visit({ id: "recent", starts_at: daysAgo(30) }),
      ],
      new Set(),
      NOW,
    );
    assert.equal(out.length, 0);
  });

  it("matches the same patient across phone formats", () => {
    const out = selectRecalls(
      [
        visit({ id: "a", phone: "+20 100 555 1234", starts_at: daysAgo(365) }),
        visit({ id: "b", phone: "0100-555-1234", starts_at: daysAgo(30) }),
      ],
      new Set(),
      NOW,
    );
    assert.equal(out.length, 0, "the recent visit under another format must count");
  });

  it("never recalls someone who already has an appointment booked", () => {
    const out = selectRecalls(
      [visit({ starts_at: daysAgo(200) })],
      new Set(["05551234"]),
      NOW,
    );
    assert.equal(out.length, 0);
  });

  it("keys the recall on the lapsed visit, so one lapse is recalled once", () => {
    const [first] = selectRecalls([visit({ id: "v9", starts_at: daysAgo(200) })], new Set(), NOW);
    const [again] = selectRecalls([visit({ id: "v9", starts_at: daysAgo(200) })], new Set(), new Date(NOW.getTime() + 7 * 86_400_000));
    assert.equal(first.dedupe_key, again.dedupe_key);
  });
});

describe("selectReviewRequests", () => {
  const SENT = "2026-09-09T10:00:00Z";
  const later = (h: number) => new Date(Date.parse(SENT) + h * 3_600_000).toISOString();
  const followup = (over: Record<string, unknown> = {}) => ({
    id: "n1",
    reservation_id: "r1",
    conversation_id: "c1",
    phone: "+201005551234",
    patient_name: "Ahmed",
    service_label: "Cleaning",
    sent_at: SENT,
    ...over,
  });
  const event = (intent: string, h: number, conversation_id = "c1") => ({
    conversation_id,
    intent,
    created_at: later(h),
  });

  it("asks a patient who replied that they are happy", () => {
    const out = selectReviewRequests([followup()], [event("feedback_positive", 2)]);
    assert.equal(out.length, 1);
    assert.equal(out[0].kind, "review_request");
    assert.equal(out[0].dedupe_key, "n1:review_request");
  });

  it("asks an unhappy patient too, but only after the call they were promised", () => {
    // "The filling is fine but I waited an hour" still gets the link — sending
    // it only to happy patients is review gating, which Google's policy
    // prohibits and which can get a clinic's reviews removed. What changes is
    // the timing: not while they are still annoyed.
    const out = selectReviewRequests(
      [followup()],
      [event("feedback_positive", 2), event("feedback_negative", 3)],
    );
    assert.equal(out.length, 1);
    assert.ok(out[0].scheduled_for, "it should be delayed, not immediate");
  });

  it("ignores praise that came before the follow-up was sent", () => {
    assert.equal(selectReviewRequests([followup()], [event("feedback_positive", -5)]).length, 0);
  });

  it("ignores a reply long after the follow-up", () => {
    assert.equal(selectReviewRequests([followup()], [event("feedback_positive", 24 * 5)]).length, 0);
  });

  it("does not cross conversations", () => {
    assert.equal(
      selectReviewRequests([followup()], [event("feedback_positive", 2, "someone-else")]).length,
      0,
    );
  });

  it("needs a follow-up that was actually delivered into a conversation", () => {
    assert.equal(selectReviewRequests([followup({ sent_at: null })], [event("feedback_positive", 2)]).length, 0);
    assert.equal(
      selectReviewRequests([followup({ conversation_id: null })], [event("feedback_positive", 2)]).length,
      0,
    );
  });
});

describe("selectReviewRequests — scored visits", () => {
  const NOW = new Date("2026-09-14T12:00:00Z");
  const followup = {
    id: "f1",
    reservation_id: "res-1",
    conversation_id: "conv-1",
    phone: "01005551234",
    patient_name: "Ahmed",
    service_label: "Cleaning",
    sent_at: "2026-09-14T09:00:00Z",
  };
  const rating = (n: number, at = "2026-09-14T10:00:00Z") => ({
    conversation_id: "conv-1",
    rating: n,
    created_at: at,
  });

  it("asks a happy patient straight away", () => {
    const out = selectReviewRequests([followup], [], [rating(5)], NOW);
    assert.equal(out.length, 1);
    assert.equal(out[0].scheduled_for, undefined);
  });

  it("still asks an unhappy one, but after the call they were promised", () => {
    // Withholding the link entirely is review gating, which Google prohibits.
    const out = selectReviewRequests([followup], [], [rating(2)], NOW);
    assert.equal(out.length, 1);
    assert.equal(out[0].scheduled_for, "2026-09-16T12:00:00.000Z");
  });

  it("treats a 3 as unhappy and a 4 as happy", () => {
    assert.ok(selectReviewRequests([followup], [], [rating(3)], NOW)[0].scheduled_for);
    assert.equal(selectReviewRequests([followup], [], [rating(4)], NOW)[0].scheduled_for, undefined);
  });

  it("uses the last score when a patient corrects themselves", () => {
    const out = selectReviewRequests(
      [followup],
      [],
      [rating(5, "2026-09-14T10:00:00Z"), rating(2, "2026-09-14T10:05:00Z")],
      NOW,
    );
    assert.ok(out[0].scheduled_for, "the later, lower score should win");
  });

  it("ignores a score given outside the reply window", () => {
    const stale = rating(5, "2026-09-20T10:00:00Z");
    assert.deepEqual(selectReviewRequests([followup], [], [stale], NOW), []);
  });

  it("falls back to sentiment for follow-ups answered before ratings existed", () => {
    const positive = [{ conversation_id: "conv-1", intent: "feedback_positive", created_at: "2026-09-14T10:00:00Z" }];
    assert.equal(selectReviewRequests([followup], positive, [], NOW).length, 1);

    const negative = [{ conversation_id: "conv-1", intent: "feedback_negative", created_at: "2026-09-14T10:00:00Z" }];
    const out = selectReviewRequests([followup], negative, [], NOW);
    assert.equal(out.length, 1, "an unhappy patient is asked later, not never");
    assert.ok(out[0].scheduled_for);
  });

  it("asks nobody who never answered", () => {
    assert.deepEqual(selectReviewRequests([followup], [], [], NOW), []);
  });
});

