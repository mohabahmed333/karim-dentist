import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { toothSurfaceUpsertSchema } from "./schemas.ts";

describe("tooth surface schema", () => {
  it("accepts adult and primary FDI with surface enums", () => {
    const parsed = toothSurfaceUpsertSchema.parse({
      fdi_number: "16",
      dentition: "adult",
      mesial: "decay",
      distal: "unmarked",
      occlusal: "filling",
      facial: "unmarked",
      lingual: "unmarked",
      whole: "none",
    });
    assert.equal(parsed.mesial, "decay");
    assert.equal(
      toothSurfaceUpsertSchema.safeParse({
        fdi_number: "51",
        dentition: "primary",
        whole: "missing",
      }).success,
      true,
    );
  });

  it("rejects invalid FDI 19 and 56", () => {
    const base = { dentition: "adult" as const, whole: "none" as const };
    assert.equal(
      toothSurfaceUpsertSchema.safeParse({ ...base, fdi_number: "19" })
        .success,
      false,
    );
    assert.equal(
      toothSurfaceUpsertSchema.safeParse({ ...base, fdi_number: "56" })
        .success,
      false,
    );
  });
});
