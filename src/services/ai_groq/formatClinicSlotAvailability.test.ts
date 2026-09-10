import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatClinicSlotAvailability } from "./formatClinicSlotAvailability";

describe("formatClinicSlotAvailability", () => {
  it("lists open slots and marks taken as unsuggestable", () => {
    const text = formatClinicSlotAvailability({
      openStartsAt: ["2026-09-08T10:00:00.000Z"],
      takenStartsAt: ["2026-09-08T11:30:00.000Z"],
    });
    assert.ok(text.includes("ONLY suggest from these"));
    assert.ok(text.includes("2026-09-08T10:00:00.000Z"));
    assert.ok(text.includes("never suggest these"));
    assert.ok(text.includes("2026-09-08T11:30:00.000Z"));
  });

  it("says not to invent times when no open slots", () => {
    const text = formatClinicSlotAvailability({
      openStartsAt: [],
      takenStartsAt: [],
    });
    assert.ok(text.includes("do not invent times"));
  });
});
