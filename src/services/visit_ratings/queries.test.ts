import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { toRatingRow } from "./queries.ts";

const raw = (over: Record<string, unknown> = {}) => ({
  id: "r1",
  rating: 2,
  comment: "استنيت كتير",
  phone: "01005551234",
  created_at: "2026-09-14T10:00:00Z",
  needs_call: true,
  called_at: null,
  conversation_id: "conv-1",
  reservations: { patient_name: "Ahmed", service_label: "Cleaning" },
  ...over,
});

describe("toRatingRow", () => {
  it("flattens the visit it belongs to", () => {
    const row = toRatingRow(raw() as never);
    assert.equal(row.patientName, "Ahmed");
    assert.equal(row.serviceLabel, "Cleaning");
    assert.equal(row.rating, 2);
    assert.equal(row.needsCall, true);
  });

  it("survives a rating whose reservation was deleted", () => {
    const row = toRatingRow(raw({ reservations: null }) as never);
    assert.equal(row.patientName, "");
    assert.equal(row.serviceLabel, "");
  });

  it("treats a missing comment as empty rather than null", () => {
    assert.equal(toRatingRow(raw({ comment: null }) as never).comment, "");
  });

  it("keeps when somebody rang them", () => {
    const row = toRatingRow(raw({ called_at: "2026-09-14T11:00:00Z", needs_call: false }) as never);
    assert.equal(row.calledAt, "2026-09-14T11:00:00Z");
    assert.equal(row.needsCall, false);
  });
});
