import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { listAiActionProposals } from "./listProposals.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "./testing/fakeDb.ts";

function proposal(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    created_by: "u1",
    status: "confirmed",
    source: "clinic-chat",
    patient_key: null,
    summary: "Booked a follow-up",
    actions: [],
    diffs: [],
    snapshot_hash: "h1",
    expires_at: "2026-09-14T00:00:00.000Z",
    confirmed_at: "2026-09-14T00:00:00.000Z",
    result: null,
    created_at: "2026-09-14T00:00:00.000Z",
    updated_at: "2026-09-14T00:00:00.000Z",
    ...overrides,
  };
}

function auditEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "e1",
    proposal_id: "p1",
    actor_id: "u1",
    action_kind: "reservation.create",
    target: "Book appointment",
    outcome: "confirmed",
    before_summary: null,
    after_summary: null,
    error_message: null,
    created_at: "2026-09-14T00:00:00.000Z",
    ...overrides,
  };
}

describe("listAiActionProposals", () => {
  it("returns newest-first proposals with their audit events attached", async () => {
    const db = createFakeDb({
      tables: {
        ai_action_proposals: [
          proposal({ id: "p1", created_at: "2026-09-14T00:00:00.000Z" }),
          proposal({ id: "p2", created_at: "2026-09-13T00:00:00.000Z" }),
        ],
        ai_action_audit_events: [
          auditEvent({ id: "e1", proposal_id: "p1" }),
          auditEvent({ id: "e2", proposal_id: "p2", outcome: "failed" }),
        ],
      },
    });

    const { rows, nextCursor } = await listAiActionProposals(db, {});

    assert.equal(rows.length, 2);
    assert.equal(rows[0].id, "p1");
    assert.equal(rows[1].id, "p2");
    assert.equal(rows[0].auditEvents.length, 1);
    assert.equal(rows[0].auditEvents[0].id, "e1");
    assert.equal(rows[1].auditEvents[0].outcome, "failed");
    assert.equal(nextCursor, null);
  });

  it("filters by status", async () => {
    const db = createFakeDb({
      tables: {
        ai_action_proposals: [
          proposal({ id: "p1", status: "pending" }),
          proposal({ id: "p2", status: "confirmed" }),
        ],
        ai_action_audit_events: [],
      },
    });

    const { rows } = await listAiActionProposals(db, { status: "pending" });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, "p1");
  });

  it("paginates with a created_at cursor, one page ahead to detect more", async () => {
    const db = createFakeDb({
      tables: {
        ai_action_proposals: [
          proposal({ id: "p1", created_at: "2026-09-14T00:00:00.000Z" }),
          proposal({ id: "p2", created_at: "2026-09-13T00:00:00.000Z" }),
          proposal({ id: "p3", created_at: "2026-09-12T00:00:00.000Z" }),
        ],
        ai_action_audit_events: [],
      },
    });

    const { rows, nextCursor } = await listAiActionProposals(db, { limit: 2 });

    assert.equal(rows.length, 2);
    assert.deepEqual(rows.map((r: { id: string }) => r.id), ["p1", "p2"]);
    assert.equal(nextCursor, "2026-09-13T00:00:00.000Z");
  });
});
