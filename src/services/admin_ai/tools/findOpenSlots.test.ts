import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "../testing/fakeDb.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { findOpenSlots, findOpenSlotsArgs } from "./findOpenSlots.ts";

const OPEN_IN_DAY = { id: "s1", starts_at: "2026-09-15T08:00:00.000Z", status: "open" };
const OPEN_NEXT_DAY = { id: "s2", starts_at: "2026-09-15T22:00:00.000Z", status: "open" };
const BOOKED_IN_DAY = { id: "s3", starts_at: "2026-09-15T09:00:00.000Z", status: "booked" };

describe("findOpenSlots", () => {
  it("lists only open slots inside the given clinic-local day", async () => {
    const db = createFakeDb({
      tables: { appointment_slots: [OPEN_IN_DAY, OPEN_NEXT_DAY, BOOKED_IN_DAY] },
    });
    const out = await findOpenSlots(db as never, findOpenSlotsArgs.parse({ date: "2026-09-15" }));
    assert.deepEqual(out, [{ slotId: "s1", starts_at: OPEN_IN_DAY.starts_at }]);
  });

  it("returns an empty list rather than an error when nothing is open", async () => {
    const db = createFakeDb({ tables: { appointment_slots: [] } });
    const out = await findOpenSlots(db as never, findOpenSlotsArgs.parse({ date: "2026-09-15" }));
    assert.deepEqual(out, []);
  });
});
