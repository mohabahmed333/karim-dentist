import {
  BUTTON_TITLE_LIMIT,
  formatSlotButtonLabel,
} from "@/services/patient_notifications/formatWhen";
import {
  LIST_ROW_DESCRIPTION_LIMIT,
  LIST_ROW_LIMIT,
  LIST_ROW_TITLE_LIMIT,
} from "@/services/whatsapp/interactiveButtons";
import type { BodyLanguage } from "@/services/patient_notifications/templates";

/** WhatsApp shows at most three reply buttons on one message. */
export const MAX_BUTTONS = 3;

export type ReplyButton = { id: string; title: string };

export type ReplyRow = { id: string; title: string; description?: string };

/**
 * The interactive attachment on a reply, if any.
 *
 * A WhatsApp message carries buttons or a list, never both — so this is a
 * union rather than two optional fields, and the choice is made in one place.
 */
export type ReplyUi =
  | { kind: "buttons"; buttons: ReplyButton[] }
  | { kind: "list"; button: string; rows: ReplyRow[] };

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

/** The row that lets someone book without naming a service at all. */
export const NOT_SURE_ID = "service:not_sure";

/** What "I am not sure" books. The same label the booking RPC defaults to. */
export const GENERAL_CONSULTATION = "General consultation";

const UNTITLED = /^(untitled|بدون عنوان)$/i;

/**
 * The clinic's services as list rows, ending with a way out.
 *
 * A list, not buttons: a button title stops at 20 characters and the clinic's
 * names run to 44 ("Surgical extractions and surgical treatments"), so buttons
 * could only ever show a truncated few. The full name goes in the description
 * when the title has to be cut, so nothing is lost to the patient.
 *
 * The last row matters most. Someone who does not know what they need can say
 * so in one tap and still get an appointment, which is the whole point of the
 * service being optional.
 */
export function serviceRows(
  services: { title: string; title_ar?: string | null }[],
  language: BodyLanguage,
): ReplyRow[] {
  const rows: ReplyRow[] = [];
  const taken = new Set<string>();

  for (const service of services) {
    if (rows.length >= LIST_ROW_LIMIT - 1) break;
    const name = (language === "ar" ? service.title_ar || service.title : service.title).trim();
    if (!name || UNTITLED.test(name)) continue;
    const title = name.length <= LIST_ROW_TITLE_LIMIT ? name : name.slice(0, LIST_ROW_TITLE_LIMIT).trim();
    if (taken.has(title)) continue;
    taken.add(title);
    rows.push({
      id: `service:${rows.length}`,
      title,
      ...(title === name ? {} : { description: name.slice(0, LIST_ROW_DESCRIPTION_LIMIT) }),
    });
  }

  if (rows.length === 0) return [];

  rows.push(
    language === "ar"
      ? {
          id: NOT_SURE_ID,
          title: "مش متأكد",
          description: "كشف واستشارة — الدكتور يحدد العلاج المناسب",
        }
      : {
          id: NOT_SURE_ID,
          title: "I am not sure",
          description: "General consultation — the dentist advises in person",
        },
  );
  return rows;
}

/**
 * What the patient can tap on this reply, if anything.
 *
 * Kept pure and in one place so the order of preference can be read at a
 * glance: a booking under way needs nothing, a chosen time needs confirming,
 * offered times are worth more than anything else, and only then is it worth
 * asking which service — as taps, never as an open question.
 */
export function replyUi(input: {
  language: BodyLanguage;
  /** Times the server offered this turn — already validated, never the model's. */
  offeredSlots: ButtonSlot[];
  /** The clinic's own catalogue, for the service chooser. */
  services: { title: string; title_ar?: string | null }[];
  /** A time the patient has already chosen, carried between turns. */
  pendingSlotId?: string;
  /** A service they already named — settled, so never asked again. */
  pendingService?: string;
  /** The model is asking which service they want. */
  askingService: boolean;
  canBook: boolean;
  /** True when this turn is already performing the booking. */
  willExecuteAction: boolean;
}): ReplyUi | null {
  // The booking is happening now; anything tappable would invite a second one.
  if (input.willExecuteAction) return null;

  if (input.pendingSlotId) {
    // Never offer to confirm what we are not allowed to write. A confirm button
    // that cannot book is a lie the patient taps.
    return input.canBook ? { kind: "buttons", buttons: confirmButtons(input.language) } : null;
  }

  const slots = slotButtons(input.offeredSlots, input.language);
  if (slots.length > 0) return { kind: "buttons", buttons: slots };

  if (input.askingService && !input.pendingService) {
    const rows = serviceRows(input.services, input.language);
    if (rows.length === 0) return null;
    return {
      kind: "list",
      button: input.language === "ar" ? "اختار الخدمة" : "Choose a service",
      rows,
    };
  }

  return null;
}
