import { describe, expect, it } from "vitest";
import { formatClinicSlotAvailability } from "./formatClinicSlotAvailability";

describe("formatClinicSlotAvailability", () => {
  it("lists open slots and marks taken as unsuggestable", () => {
    const text = formatClinicSlotAvailability({
      openStartsAt: ["2026-09-08T10:00:00.000Z"],
      takenStartsAt: ["2026-09-08T11:30:00.000Z"],
    });
    expect(text).toContain("ONLY suggest from these");
    expect(text).toContain("2026-09-08T10:00:00.000Z");
    expect(text).toContain("never suggest these");
    expect(text).toContain("2026-09-08T11:30:00.000Z");
  });

  it("says not to invent times when no open slots", () => {
    const text = formatClinicSlotAvailability({
      openStartsAt: [],
      takenStartsAt: [],
    });
    expect(text).toContain("do not invent times");
  });
});
