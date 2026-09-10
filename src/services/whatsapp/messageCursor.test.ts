import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildMessageCursorFilter } from "./messageCursor.ts";

describe("buildMessageCursorFilter", () => {
  const cursor = { waTimestamp: "2026-09-08T10:00:00.000Z", id: "abc-123" };

  /**
   * The regression: the query applied only `.lt("wa_timestamp", …)`, so any
   * messages sharing the cursor's exact timestamp were skipped at a page
   * boundary. Ordering is (wa_timestamp desc, id desc), so the cursor must be
   * composite: strictly older, OR same instant with a smaller id.
   */
  it("pages on the full composite key, not the timestamp alone", () => {
    assert.equal(
      buildMessageCursorFilter(cursor),
      "wa_timestamp.lt.2026-09-08T10:00:00.000Z," +
        "and(wa_timestamp.eq.2026-09-08T10:00:00.000Z,id.lt.abc-123)",
    );
  });

  it("includes the tie-breaker branch so equal timestamps are not skipped", () => {
    const filter = buildMessageCursorFilter(cursor);
    assert.ok(filter.includes("wa_timestamp.eq."));
    assert.ok(filter.includes("id.lt."));
  });

  it("returns null for a missing cursor", () => {
    assert.equal(buildMessageCursorFilter(null), null);
    assert.equal(buildMessageCursorFilter(undefined), null);
  });

  it("rejects a cursor carrying PostgREST separators, rather than injecting", () => {
    assert.equal(
      buildMessageCursorFilter({ waTimestamp: "2026-01-01T00:00:00Z", id: "a,b" }),
      null,
    );
    assert.equal(
      buildMessageCursorFilter({ waTimestamp: "x)or(1.eq.1", id: "abc" }),
      null,
    );
  });

  it("rejects an empty id or timestamp", () => {
    assert.equal(buildMessageCursorFilter({ waTimestamp: "", id: "abc" }), null);
    assert.equal(buildMessageCursorFilter({ waTimestamp: "2026-01-01", id: "" }), null);
  });
});
