import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { listSystemActions } from "./listActions.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "../admin_ai/testing/fakeDb.ts";

function entry(overrides: Record<string, unknown> = {}) {
  return {
    id: "e1",
    table_name: "reservations",
    row_id: "r1",
    operation: "update",
    actor_id: "u1",
    before: { status: "confirmed" },
    after: { status: "cancelled" },
    created_at: "2026-09-15T00:00:00.000Z",
    reverted_at: null,
    reverted_by: null,
    ...overrides,
  };
}

describe("listSystemActions", () => {
  it("returns newest-first entries, marking revertible ones", async () => {
    const db = createFakeDb({
      tables: {
        system_action_log: [
          entry({ id: "e1", created_at: "2026-09-15T00:00:00.000Z", table_name: "reservations" }),
          entry({ id: "e2", created_at: "2026-09-14T00:00:00.000Z", table_name: "whatsapp_conversations" }),
        ],
      },
    });

    const { rows, nextCursor } = await listSystemActions(db, {});

    assert.equal(rows.length, 2);
    assert.equal(rows[0].id, "e1");
    assert.equal(rows[0].revertible, true);
    assert.equal(rows[1].id, "e2");
    assert.equal(rows[1].revertible, false);
    assert.equal(nextCursor, null);
  });

  it("marks an already-reverted entry as not revertible", async () => {
    const db = createFakeDb({
      tables: {
        system_action_log: [entry({ reverted_at: "2026-09-15T01:00:00.000Z" })],
      },
    });

    const { rows } = await listSystemActions(db, {});
    assert.equal(rows[0].revertible, false);
  });

  it("filters by table and operation", async () => {
    const db = createFakeDb({
      tables: {
        system_action_log: [
          entry({ id: "e1", table_name: "reservations", operation: "update" }),
          entry({ id: "e2", table_name: "patients", operation: "delete" }),
        ],
      },
    });

    const byTable = await listSystemActions(db, { table: "patients" });
    assert.deepEqual(byTable.rows.map((r: { id: string }) => r.id), ["e2"]);

    const byOperation = await listSystemActions(db, { operation: "delete" });
    assert.deepEqual(byOperation.rows.map((r: { id: string }) => r.id), ["e2"]);
  });

  it("paginates with a created_at cursor, one page ahead to detect more", async () => {
    const db = createFakeDb({
      tables: {
        system_action_log: [
          entry({ id: "e1", created_at: "2026-09-15T00:00:00.000Z" }),
          entry({ id: "e2", created_at: "2026-09-14T00:00:00.000Z" }),
          entry({ id: "e3", created_at: "2026-09-13T00:00:00.000Z" }),
        ],
      },
    });

    const { rows, nextCursor } = await listSystemActions(db, { limit: 2 });
    assert.deepEqual(rows.map((r: { id: string }) => r.id), ["e1", "e2"]);
    assert.equal(nextCursor, "2026-09-14T00:00:00.000Z");
  });
});
