import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { bookChoiceActions, shouldOfferBookChoice } from "./bookChoice.ts";

const t = (key: string) => key;

test("offers book choice only when an active patient is set", () => {
  assert.equal(shouldOfferBookChoice(null), false);
  assert.equal(shouldOfferBookChoice(undefined), false);
  assert.equal(
    shouldOfferBookChoice({ patientKey: "p1", name: "Sara", phone: "010" }),
    true,
  );
});

test("book choice chips are replace reservation and reserve for chat", () => {
  const actions = bookChoiceActions(t as never);
  assert.deepEqual(
    actions.map((a) => a.id),
    ["book:replace", "book:for-chat"],
  );
  assert.equal(actions[0]?.label, "admin.chat.action.replaceReservation");
  assert.equal(actions[1]?.label, "admin.chat.action.bookForChat");
});
