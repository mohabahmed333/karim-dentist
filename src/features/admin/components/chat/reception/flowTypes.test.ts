import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { patientScopedActions } from "./flowTypes.ts";

const t = (key: string) => key;

describe("patientScopedActions", () => {
  it("offers Book for name when no prior reservation in chat", () => {
    const actions = patientScopedActions(
      {
        patientKey: "p1",
        name: "Sara Ali",
        phone: "0100",
      },
      t as never,
    );
    const book = actions.find((a) => a.id === "patient:book");
    assert.ok(book);
    assert.equal(book.label, "admin.chat.action.bookFor");
    assert.equal(book.payload?.reservationId, undefined);
  });

  it("offers Replace reservation when chat already booked this patient", () => {
    const actions = patientScopedActions(
      {
        patientKey: "p1",
        name: "Sara Ali",
        phone: "0100",
        lastReservationId: "res-9",
      },
      t as never,
    );
    const book = actions.find((a) => a.id === "patient:book");
    assert.ok(book);
    assert.equal(book.label, "admin.chat.action.replaceReservation");
    assert.equal(book.payload?.reservationId, "res-9");
  });

  it("offers Add another note after a note was saved", () => {
    const actions = patientScopedActions(
      {
        patientKey: "p1",
        name: "Sara Ali",
        phone: "0100",
        noteCount: 1,
      },
      t as never,
    );
    const note = actions.find((a) => a.id === "patient:note");
    assert.ok(note);
    assert.equal(note.label, "admin.chat.action.addAnotherNote");
  });
});
