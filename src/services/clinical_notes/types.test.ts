import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildClinicalNote, noteHeaderLabel } from "./types.ts";

describe("clinical notes", () => {
  it("labels general visit vs tooth target", () => {
    assert.equal(noteHeaderLabel(null), "General Visit Note");
    assert.equal(
      noteHeaderLabel({ id: "visit", label: "Visit" }),
      "General Visit Note",
    );
    assert.equal(
      noteHeaderLabel({ id: "34", label: "Tooth #34" }),
      "Note for Tooth #34",
    );
  });

  it("builds a trimmed note payload", () => {
    const note = buildClinicalNote({
      targetId: "proc-1",
      category: "SOAP",
      content: "  Deep decay on distal  ",
    });
    assert.equal(note.content, "Deep decay on distal");
    assert.equal(note.category, "SOAP");
    assert.equal(note.author, "Dentist");
    assert.ok(note.id.length > 0);
    assert.ok(note.createdAt.includes("T"));
  });
});
