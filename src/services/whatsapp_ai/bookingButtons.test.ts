import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { BUTTON_TITLE_LIMIT } from "@/services/patient_notifications/formatWhen";
import {
  CHANGE_ID,
  CONFIRM_ID,
  MAX_BUTTONS,
  NOT_SURE_ID,
  choiceButtons,
  confirmButtons,
  replyUi,
  serviceRows,
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

describe("serviceRows", () => {
  const services = [
    { title: "Dental implants", title_ar: "زراعة الأسنان" },
    { title: "Surgical extractions and surgical treatments", title_ar: "القلع الجراحي والعلاجات الجراحية" },
    { title: "Untitled", title_ar: "بدون عنوان" },
  ];

  it("keeps every row within what WhatsApp will show", () => {
    for (const language of ["ar", "en"] as const) {
      for (const row of serviceRows(services, language)) {
        assert.ok(row.title.length <= 24, row.title);
        assert.ok((row.description?.length ?? 0) <= 72, row.description);
      }
    }
  });

  /** A 44-character name cannot fit a row title, but must not be lost either. */
  it("moves a name too long for the title into the description", () => {
    const row = serviceRows(services, "en").find((r) => r.title.startsWith("Surgical"));
    assert.ok(row);
    assert.equal(row.description, "Surgical extractions and surgical treatments");
  });

  it("never offers the placeholder row as a treatment", () => {
    for (const language of ["ar", "en"] as const) {
      const titles = serviceRows(services, language).map((r) => r.title);
      assert.equal(titles.some((t) => /untitled|بدون عنوان/i.test(t)), false);
    }
  });

  it("always ends with a way to book without choosing", () => {
    for (const language of ["ar", "en"] as const) {
      const rows = serviceRows(services, language);
      assert.equal(rows[rows.length - 1].id, NOT_SURE_ID);
    }
  });

  it("offers nothing at all when the clinic lists nothing", () => {
    assert.deepEqual(serviceRows([], "ar"), []);
  });

  it("never exceeds WhatsApp's ten rows, counting the way out", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      title: `Service ${i}`,
      title_ar: `خدمة ${i}`,
    }));
    assert.ok(serviceRows(many, "en").length <= 10);
  });
});

describe("replyUi", () => {
  const one = [slot("11111111-1111-4111-8111-111111111111", "2026-09-13T07:30:00.000Z")];
  const chosen = "11111111-1111-4111-8111-111111111111";
  const services = [{ title: "Dental implants", title_ar: "زراعة الأسنان" }];
  const base = {
    language: "en" as const,
    offeredSlots: one,
    services,
    askingService: false,
    canBook: true,
    willExecuteAction: false,
  };

  it("offers the times while none is chosen", () => {
    const ui = replyUi(base);
    assert.equal(ui?.kind, "buttons");
    assert.match(ui!.kind === "buttons" ? ui!.buttons[0].id : "", /^slot:/);
  });

  it("offers confirming once a time is chosen", () => {
    const ui = replyUi({ ...base, pendingSlotId: chosen });
    assert.equal(ui?.kind, "buttons");
    assert.deepEqual(
      ui!.kind === "buttons" ? ui!.buttons.map((b) => b.id) : [],
      [CONFIRM_ID, CHANGE_ID],
    );
  });

  /** The whole reason canBook is a parameter: the tap has to mean something. */
  it("offers nothing to confirm when it is not allowed to book", () => {
    assert.equal(replyUi({ ...base, pendingSlotId: chosen, canBook: false }), null);
  });

  it("offers nothing while the booking is already being made", () => {
    assert.equal(replyUi({ ...base, pendingSlotId: chosen, willExecuteAction: true }), null);
  });

  it("offers the service list when it is asking which service", () => {
    const ui = replyUi({ ...base, offeredSlots: [], askingService: true });
    assert.equal(ui?.kind, "list");
    assert.equal(ui!.kind === "list" ? ui!.rows[ui!.rows.length - 1].id : "", NOT_SURE_ID);
  });

  /** Times are the thing that matters; a service question can wait. */
  it("prefers offering times over asking which service", () => {
    const ui = replyUi({ ...base, askingService: true });
    assert.equal(ui?.kind, "buttons");
  });

  it("does not ask again for a service already settled", () => {
    const ui = replyUi({
      ...base,
      offeredSlots: [],
      askingService: true,
      pendingService: "Dental implants",
    });
    assert.equal(ui, null);
  });
});

describe("choiceButtons — the model's own suggested answers", () => {
  it("offers them in the order given", () => {
    const buttons = choiceButtons(["تغيير الموعد", "حجز جديد"]);
    assert.deepEqual(buttons.map((b) => b.title), ["تغيير الموعد", "حجز جديد"]);
    assert.deepEqual(buttons.map((b) => b.id), ["choice:0", "choice:1"]);
  });

  it("never offers more than WhatsApp shows", () => {
    assert.equal(choiceButtons(["أ", "ب", "ج", "د", "هـ"]).length, 3);
  });

  /** Truncating an answer can turn it into a different answer. */
  it("drops a choice too long for a button rather than cutting it", () => {
    const buttons = choiceButtons(["نعم", "x".repeat(21)]);
    assert.deepEqual(buttons.map((b) => b.title), ["نعم"]);
  });

  it("drops duplicates, which WhatsApp would reject the message over", () => {
    assert.equal(choiceButtons(["نعم", "نعم ", "NEE"]).length, 2);
  });

  it("strips an identifier the model slipped into a choice", () => {
    const buttons = choiceButtons(["slotId=11111111-1111-4111-8111-111111111111"]);
    assert.deepEqual(buttons, []);
  });

  it("offers nothing for blanks or a missing list", () => {
    assert.deepEqual(choiceButtons([]), []);
    assert.deepEqual(choiceButtons(["", "   "]), []);
  });
});

describe("replyUi — where choices sit in the order of preference", () => {
  const services = [{ title: "Dental implants", title_ar: "زراعة الأسنان" }];
  const base = {
    language: "ar" as const,
    offeredSlots: [],
    services,
    askingService: false,
    canBook: true,
    willExecuteAction: false,
  };

  it("offers the model's answers when there is nothing structural to show", () => {
    const ui = replyUi({ ...base, choices: ["تغيير الموعد", "حجز جديد"] });
    assert.equal(ui?.kind, "buttons");
    assert.deepEqual(
      ui!.kind === "buttons" ? ui!.buttons.map((b) => b.title) : [],
      ["تغيير الموعد", "حجز جديد"],
    );
  });

  /** A real appointment time is worth more than a yes/no. */
  it("prefers offered times over the model's answers", () => {
    const ui = replyUi({
      ...base,
      offeredSlots: [slot("11111111-1111-4111-8111-111111111111", "2026-09-14T07:30:00.000Z")],
      choices: ["نعم", "لا"],
    });
    assert.equal(ui?.kind, "buttons");
    assert.match(ui!.kind === "buttons" ? ui!.buttons[0].id : "", /^slot:/);
  });

  it("offers nothing when the model proposed nothing", () => {
    assert.equal(replyUi({ ...base, choices: [] }), null);
  });
});
