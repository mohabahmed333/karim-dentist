import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { diffFieldLines } from "./reviewCardFormat.ts";

describe("diffFieldLines", () => {
  it("only lists fields that actually changed", () => {
    const lines = diffFieldLines({
      before: { status: "open", starts_at: "2026-09-15T10:00:00.000Z" },
      after: { status: "booked", starts_at: "2026-09-15T10:00:00.000Z" },
    });
    assert.deepEqual(lines, [{ field: "status", before: "open", after: "booked" }]);
  });

  it("formats a boolean as Yes/No, localizable", () => {
    const lines = diffFieldLines(
      { before: { pinned: false }, after: { pinned: true } },
      { yes: "نعم", no: "لا", empty: "—" },
    );
    assert.deepEqual(lines, [{ field: "pinned", before: "لا", after: "نعم" }]);
  });

  it("joins an array of strings", () => {
    const lines = diffFieldLines({
      before: { allergies: [] },
      after: { allergies: ["Penicillin", "Latex"] },
    });
    assert.deepEqual(lines, [{ field: "allergies", before: "—", after: "Penicillin, Latex" }]);
  });

  it("shows an em dash for null, undefined or empty string", () => {
    const lines = diffFieldLines({ before: { notes: null }, after: { notes: "" } });
    // Both sides render as "—", but the raw values did differ (null !== ""),
    // so the field still surfaces — hiding it here would look like nothing changed.
    assert.deepEqual(lines, [{ field: "notes", before: "—", after: "—" }]);
  });

  it("truncates a very long value", () => {
    const long = "x".repeat(200);
    const lines = diffFieldLines({ before: {}, after: { content: long } });
    assert.equal(lines[0]?.after.length, 80);
  });

  it("returns nothing when before and after are identical", () => {
    assert.deepEqual(diffFieldLines({ before: { a: 1 }, after: { a: 1 } }), []);
  });
});
