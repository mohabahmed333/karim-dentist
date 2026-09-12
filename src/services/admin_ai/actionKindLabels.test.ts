import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { actionKindLabel } from "./actionKindLabels.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { actionKindSchema } from "./schemas.ts";

describe("actionKindLabel", () => {
  it("gives every declared action kind a human label in both languages", () => {
    for (const kind of actionKindSchema.options as string[]) {
      const en = actionKindLabel(kind, "en");
      const ar = actionKindLabel(kind, "ar");
      assert.notEqual(en, kind, `${kind} has no English label`);
      assert.notEqual(ar, kind, `${kind} has no Arabic label`);
    }
  });

  it("translates a known kind", () => {
    assert.equal(actionKindLabel("reservation.create", "en"), "Book appointment");
    assert.equal(actionKindLabel("reservation.create", "ar"), "حجز موعد");
  });

  it("falls back to the raw kind for something unrecognised", () => {
    assert.equal(actionKindLabel("sql.drop", "en"), "sql.drop");
  });

  it("defaults to English", () => {
    assert.equal(actionKindLabel("note.clinical"), actionKindLabel("note.clinical", "en"));
  });
});
