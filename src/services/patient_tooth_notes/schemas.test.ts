import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { toothNoteBodySchema, toothNoteUpdateSchema } from "./schemas.ts";

describe("tooth note schema", () => {
  it("accepts a trimmed non-empty note body", () => {
    const parsed = toothNoteBodySchema.safeParse({
      fdi_number: "22",
      body: "  Watch mesial chip  ",
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.body, "Watch mesial chip");
    }
  });

  it("rejects empty notes and invalid FDI numbers", () => {
    assert.equal(
      toothNoteBodySchema.safeParse({ fdi_number: "22", body: "   " }).success,
      false,
    );
    assert.equal(
      toothNoteBodySchema.safeParse({ fdi_number: "22", body: "<p></p>" })
        .success,
      false,
    );
    assert.equal(
      toothNoteBodySchema.safeParse({ fdi_number: "99", body: "ok" }).success,
      false,
    );
    assert.equal(
      toothNoteBodySchema.safeParse({ fdi_number: "19", body: "ok" }).success,
      false,
    );
    assert.equal(
      toothNoteBodySchema.safeParse({ fdi_number: "51", body: "Primary molar" })
        .success,
      true,
    );
    assert.equal(toothNoteUpdateSchema.safeParse({ body: "   " }).success, false);
  });
});
