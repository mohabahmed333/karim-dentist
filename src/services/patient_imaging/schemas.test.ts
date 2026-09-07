import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { imagingCreateSchema } from "./schemas";

describe("patient imaging schemas", () => {
  it("accepts a valid x-ray create payload", () => {
    const parsed = imagingCreateSchema.parse({
      title: "Bitewing left",
      kind: "xray",
      tooth_number: 14,
      file_url: "https://example.com/xray.jpg",
      file_name: "xray.jpg",
      mime_type: "image/jpeg",
      taken_at: "2026-09-01T10:00:00.000Z",
    });
    assert.equal(parsed.kind, "xray");
    assert.equal(parsed.tooth_number, 14);
  });

  it("rejects empty title", () => {
    const result = imagingCreateSchema.safeParse({
      title: "  ",
      file_url: "https://example.com/xray.jpg",
      file_name: "xray.jpg",
      mime_type: "image/jpeg",
    });
    assert.equal(result.success, false);
  });

  it("rejects tooth numbers outside 1–32", () => {
    const result = imagingCreateSchema.safeParse({
      title: "Scan",
      tooth_number: 99,
      file_url: "https://example.com/xray.jpg",
      file_name: "xray.jpg",
      mime_type: "image/jpeg",
    });
    assert.equal(result.success, false);
  });
});
