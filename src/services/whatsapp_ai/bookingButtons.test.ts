import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { BUTTON_TITLE_LIMIT } from "@/services/patient_notifications/formatWhen";
import {
  CHANGE_ID,
  CONFIRM_ID,
  MAX_BUTTONS,
  confirmButtons,
  replyButtons,
  slotButtons,
  // @ts-expect-error -- Node strip-types needs the extension.
} from "./bookingButtons.ts";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const slot = (id: string, startsAt: string) => ({ id, starts_at: startsAt });

const FIVE = [
  slot("11111111-1111-4111-8111-111111111111", "2026-09-13T07:30:00.000Z"),
  slot("22222222-2222-4222-8222-222222222222", "2026-09-13T11:00:00.000Z"),
  slot("33333333-3333-4333-8333-333333333333", "2026-09-14T08:00:00.000Z"),
  slot("44444444-4444-4444-8444-444444444444", "2026-09-15T08:00:00.000Z"),
  slot("55555555-5555-4555-8555-555555555555", "2026-09-16T08:00:00.000Z"),
];

describe("slotButtons", () => {
  it("offers no more than WhatsApp will show", () => {
    assert.equal(slotButtons(FIVE, "ar").length, MAX_BUTTONS);
  });

  it("carries the slot id where the patient cannot see it", () => {
    for (const button of slotButtons(FIVE, "en")) {
      assert.match(button.id, /^slot:/);
      assert.match(button.id, UUID);
      // The title is what the patient reads, and what a tap sends back.
      assert.doesNotMatch(button.title, UUID);
    }
  });

  it("keeps every title within WhatsApp's limit, in both languages", () => {
    for (const language of ["ar", "en"] as const) {
      for (const button of slotButtons(FIVE, language)) {
        assert.ok(button.title.length <= BUTTON_TITLE_LIMIT, button.title);
      }
    }
  });

  /** Identical titles make WhatsApp reject the whole message, not just one button. */
  it("separates two slots that fall on the same weekday and time", () => {
    const sameTimeNextWeek = [
      slot("11111111-1111-4111-8111-111111111111", "2026-09-13T07:30:00.000Z"),
      slot("22222222-2222-4222-8222-222222222222", "2026-09-20T07:30:00.000Z"),
    ];
    for (const language of ["ar", "en"] as const) {
      const buttons = slotButtons(sameTimeNextWeek, language);
      const titles = buttons.map((b) => b.title);
      assert.equal(new Set(titles).size, titles.length, titles.join(" | "));
      assert.equal(buttons.length, 2);
    }
  });

  it("offers nothing when the clinic has nothing open", () => {
    assert.deepEqual(slotButtons([], "ar"), []);
  });
});

describe("confirmButtons", () => {
  it("offers confirming and choosing again, in the patient's language", () => {
    for (const language of ["ar", "en"] as const) {
      const buttons = confirmButtons(language);
      assert.equal(buttons.length, 2);
      assert.deepEqual(
        buttons.map((b) => b.id),
        [CONFIRM_ID, CHANGE_ID],
      );
      for (const button of buttons) {
        assert.ok(button.title.length <= BUTTON_TITLE_LIMIT, button.title);
      }
      assert.notEqual(buttons[0].title, buttons[1].title);
    }
  });
});

describe("replyButtons", () => {
  const one = [slot("11111111-1111-4111-8111-111111111111", "2026-09-13T07:30:00.000Z")];
  const chosen = "11111111-1111-4111-8111-111111111111";

  it("offers the times while none is chosen", () => {
    const buttons = replyButtons({
      language: "ar",
      offeredSlots: one,
      canBook: true,
      willExecuteAction: false,
    });
    assert.equal(buttons.length, 1);
    assert.match(buttons[0].id, /^slot:/);
  });

  it("offers confirming once a time is chosen", () => {
    const buttons = replyButtons({
      language: "en",
      offeredSlots: one,
      pendingSlotId: chosen,
      canBook: true,
      willExecuteAction: false,
    });
    assert.deepEqual(buttons.map((b) => b.id), [CONFIRM_ID, CHANGE_ID]);
  });

  /** The whole reason canBook is a parameter: the tap has to mean something. */
  it("offers nothing to confirm when it is not allowed to book", () => {
    assert.deepEqual(
      replyButtons({
        language: "en",
        offeredSlots: one,
        pendingSlotId: chosen,
        canBook: false,
        willExecuteAction: false,
      }),
      [],
    );
  });

  it("offers nothing while the booking is already being made", () => {
    assert.deepEqual(
      replyButtons({
        language: "ar",
        offeredSlots: one,
        pendingSlotId: chosen,
        canBook: true,
        willExecuteAction: true,
      }),
      [],
    );
  });

  it("offers nothing when the clinic has no open times", () => {
    assert.deepEqual(
      replyButtons({
        language: "en",
        offeredSlots: [],
        canBook: true,
        willExecuteAction: false,
      }),
      [],
    );
  });
});
