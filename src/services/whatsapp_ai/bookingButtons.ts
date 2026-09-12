import {
  BUTTON_TITLE_LIMIT,
  formatSlotButtonLabel,
} from "@/services/patient_notifications/formatWhen";
import type { BodyLanguage } from "@/services/patient_notifications/templates";

/** WhatsApp shows at most three reply buttons on one message. */
export const MAX_BUTTONS = 3;

export type ReplyButton = { id: string; title: string };

export type ButtonSlot = { id: string; starts_at: string };

/** The ids the patient's tap comes back as, so both ends agree on one spelling. */
export const CONFIRM_ID = "booking:confirm";
export const CHANGE_ID = "booking:change";

function label(slot: ButtonSlot, language: BodyLanguage, withDate: boolean): string {
  const base = formatSlotButtonLabel(slot.starts_at, language);
  if (!withDate) return base;
  const day = new Intl.DateTimeFormat(language === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
    timeZone: "Africa/Cairo",
    day: "numeric",
    month: "numeric",
  }).format(new Date(slot.starts_at));
  return `${day} ${base}`;
}

/**
 * Tappable buttons for the times the server is offering.
 *
 * Built here rather than by the model, on purpose. A button is an action, and
 * the model has already been caught putting slot identifiers where patients can
 * read them — so it says which slots it offered, and the server decides what a
 * patient can actually tap.
 *
 * The slot id rides in the button's `id`, never its title: a tap returns the
 * title as the message body, and a UUID is meaningless to a patient and a leak
 * to anyone else.
 */
export function slotButtons(
  slots: ButtonSlot[],
  language: BodyLanguage,
): ReplyButton[] {
  const buttons: ReplyButton[] = [];
  const taken = new Set<string>();

  for (const slot of slots.slice(0, MAX_BUTTONS)) {
    // WhatsApp rejects the whole message when two titles match, which happens
    // whenever the same weekday and time recur in different weeks. Naming the
    // date separates them; if that will not fit, the prose still lists the time.
    let title = label(slot, language, false);
    if (taken.has(title)) title = label(slot, language, true);
    if (taken.has(title) || title.length > BUTTON_TITLE_LIMIT) continue;
    taken.add(title);
    buttons.push({ id: `slot:${slot.id}`, title });
  }

  return buttons;
}

/**
 * The confirm pair, offered once a specific time is on the table.
 *
 * Only ever sent when the assistant is actually allowed to book: a confirm
 * button that cannot write is a lie the patient taps.
 */
export function confirmButtons(language: BodyLanguage): ReplyButton[] {
  return language === "ar"
    ? [
        { id: CONFIRM_ID, title: "أكد الحجز" },
        { id: CHANGE_ID, title: "ميعاد تاني" },
      ]
    : [
        { id: CONFIRM_ID, title: "Confirm booking" },
        { id: CHANGE_ID, title: "Another time" },
      ];
}

/**
 * Which buttons, if any, belong on this reply.
 *
 * Kept pure and separate from the sending so the rules can be read in one
 * place: a booking that is about to execute needs no buttons, a chosen time
 * needs confirming, and an offer of times needs tapping.
 */
export function replyButtons(input: {
  language: BodyLanguage;
  /** Times the server offered this turn — already validated, never the model's. */
  offeredSlots: ButtonSlot[];
  /** A time the patient has already chosen, carried between turns. */
  pendingSlotId?: string;
  canBook: boolean;
  /** True when this turn is already performing the booking. */
  willExecuteAction: boolean;
}): ReplyButton[] {
  // The booking is happening now; a button would invite a second one.
  if (input.willExecuteAction) return [];
  if (input.pendingSlotId) {
    // Never offer to confirm what we are not allowed to write. A confirm button
    // that cannot book is a lie the patient taps.
    return input.canBook ? confirmButtons(input.language) : [];
  }
  return slotButtons(input.offeredSlots, input.language);
}
