import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { briefingDateKey, shouldShowBriefing, formatBriefingText } from "./dailyBriefing.ts";

describe("briefingDateKey", () => {
  it("is the viewer's local calendar date", () => {
    assert.equal(briefingDateKey(new Date(2026, 8, 12, 23, 59)), "2026-09-12");
    assert.equal(briefingDateKey(new Date(2026, 8, 12, 0, 1)), "2026-09-12");
  });
});

describe("shouldShowBriefing", () => {
  const now = new Date(2026, 8, 12, 9, 0);

  it("shows on the first visit, when nothing was ever recorded", () => {
    assert.equal(shouldShowBriefing(null, now), true);
  });

  it("does not show again the same day", () => {
    assert.equal(shouldShowBriefing("2026-09-12", now), false);
  });

  it("shows again on a new day", () => {
    assert.equal(shouldShowBriefing("2026-09-11", now), true);
  });
});

describe("formatBriefingText", () => {
  it("names both counts when there is something of each", () => {
    const text = formatBriefingText(
      { todayCount: 8, pendingCount: 3 },
      (key: string) => key,
    );
    assert.match(text, /admin.chat.briefing.today/);
    assert.match(text, /admin.chat.briefing.pending/);
  });

  it("still reads sensibly when both counts are zero", () => {
    const text = formatBriefingText({ todayCount: 0, pendingCount: 0 }, (k: string) => k);
    assert.equal(typeof text, "string");
    assert.ok(text.length > 0);
  });
});
