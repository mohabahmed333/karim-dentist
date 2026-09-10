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

  it("never asks an unhappy patient, even one who also said something nice", () => {
    // "The filling is fine but I waited an hour" is not someone to send to Google.
    const out = selectReviewRequests(
      [followup()],
      [event("feedback_positive", 2), event("feedback_negative", 3)],
    );
    assert.equal(out.length, 0);
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
