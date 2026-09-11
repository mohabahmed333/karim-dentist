import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { loadUpcomingReservations } from "./upcomingReservations.ts";

/** Records every builder call; awaiting the chain resolves to `rows`. */
function recordingDb(rows: unknown[] | null) {
  const calls: unknown[][] = [];
  const query: Record<string, unknown> = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") {
          return (resolve: (value: unknown) => unknown) => resolve({ data: rows, error: null });
        }
        return (...args: unknown[]) => {
          calls.push([prop, ...args]);
          return query;
        };
      },
    },
  );
  return {
    calls,
    db: {
      from(table: string) {
        calls.push(["from", table]);
        return query;
      },
    },
  };
}

describe("loadUpcomingReservations", () => {
  it("matches the patient on the last 8 digits of the phone", async () => {
    const { calls, db } = recordingDb([]);
    await loadUpcomingReservations(db as never, "+20 101 2345 678");
    assert.deepEqual(calls[0], ["from", "reservations"]);
    assert.ok(calls.some((c) => c[0] === "eq" && c[1] === "phone_suffix" && c[2] === "12345678"));
  });

  it("only looks forward, soonest first, and skips cancelled or deleted visits", async () => {
    const { calls, db } = recordingDb([]);
    const now = new Date("2026-09-11T10:00:00.000Z");
    await loadUpcomingReservations(db as never, "01012345678", 1, now);
    assert.ok(calls.some((c) => c[0] === "gte" && c[1] === "starts_at" && c[2] === now.toISOString()));
    assert.ok(calls.some((c) => c[0] === "neq" && c[1] === "status" && c[2] === "cancelled"));
    assert.ok(calls.some((c) => c[0] === "is" && c[1] === "deleted_at" && c[2] === null));
    assert.ok(calls.some((c) => c[0] === "order" && c[1] === "starts_at"));
    assert.ok(calls.some((c) => c[0] === "limit" && c[1] === 1));
  });

  it("returns an empty list when the query finds nothing", async () => {
    const { db } = recordingDb(null);
    assert.deepEqual(await loadUpcomingReservations(db as never, "010"), []);
  });
});
