import {
  BUTTON_TITLE_LIMIT,
  formatSlotButtonLabel,
} from "@/services/patient_notifications/formatWhen";
import {
  LIST_ROW_DESCRIPTION_LIMIT,
  LIST_ROW_LIMIT,
  LIST_ROW_TITLE_LIMIT,
} from "@/services/whatsapp/interactiveButtons";
import { hasVisibleServiceTitle } from "@/features/portfolio/lib/serviceKindGroups";
import type { BodyLanguage } from "@/services/patient_notifications/templates";
import { stripInternalIds } from "./replyGuards";

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

/** A doctor the server is offering, for the doctor picker step. */
export type ButtonDoctor = {
  id: string;
  name: string;
  specialty?: string | null;
  /** Their next open slot, or null when they are fully booked out to the horizon. */
  nextSlotStartsAt?: string | null;
};

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
    if (!hasVisibleServiceTitle(name)) continue;
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

/** The row that books whoever has the earliest matching time, no doctor named. */
export const ANY_DOCTOR_ID = "doctor:any";

/**
 * Eligible doctors as list rows, ending with "no preference".
 *
 * A list for the same reason services are a list, not buttons: a doctor's
 * name plus specialty can run past a button's 20-character limit. Each row's
 * description carries their real next-available time (or "fully booked"),
 * from list_bookable_doctors_for_service — this is what makes the picker
 * useful rather than a bare name to choose blind.
 */
export function doctorRows(
  doctors: ButtonDoctor[],
  language: BodyLanguage,
): ReplyRow[] {
  const rows: ReplyRow[] = [];

  for (const doctor of doctors) {
    if (rows.length >= LIST_ROW_LIMIT - 1) break;
    const name = doctor.name.trim();
    if (!name) continue;
    const title = name.length <= LIST_ROW_TITLE_LIMIT ? name : name.slice(0, LIST_ROW_TITLE_LIMIT).trim();
    const when = doctor.nextSlotStartsAt
      ? formatSlotButtonLabel(doctor.nextSlotStartsAt, language)
      : language === "ar"
        ? "محجوز بالكامل"
        : "Fully booked";
    const nextLabel = language === "ar" ? `التالي: ${when}` : `Next: ${when}`;
    const description = doctor.specialty
      ? `${doctor.specialty} — ${nextLabel}`
      : nextLabel;
    rows.push({
      id: `doctor:${doctor.id}`,
      title,
      description: description.slice(0, LIST_ROW_DESCRIPTION_LIMIT),
    });
  }

  if (rows.length === 0) return [];

  rows.push(
    language === "ar"
      ? { id: ANY_DOCTOR_ID, title: "بدون تفضيل", description: "أقرب موعد متاح" }
      : { id: ANY_DOCTOR_ID, title: "No preference", description: "Earliest available" },
  );
  return rows;
}

/**
 * The model's own suggested answers, made safe to show.
 *
 * These are the only button titles the model chooses, so they are treated as
 * untrusted text: identifiers are stripped, over-long titles are dropped rather
 * than cut (a truncated answer can mean something else entirely), duplicates go
 * — WhatsApp rejects the message over two matching titles — and at most three
 * survive.
 */
export function choiceButtons(choices: string[]): ReplyButton[] {
  const buttons: ReplyButton[] = [];
  const taken = new Set<string>();

  for (const raw of choices) {
    if (buttons.length >= MAX_BUTTONS) break;
    if (typeof raw !== "string") continue;
    const title = stripInternalIds(raw).reply.replace(/\s+/g, " ").trim();
    if (!title || title.length > BUTTON_TITLE_LIMIT) continue;
    const key = title.toLowerCase();
    if (taken.has(key)) continue;
    taken.add(key);
    buttons.push({ id: `choice:${buttons.length}`, title });
  }

  return buttons;
}

/**
 * Answers the patient must type out. There is no tappable form of a name, an
 * age, or a list of medications, so nothing tappable may accompany the
 * question — a button beside "what is your name?" is an invitation to answer
 * a different question than the one asked, and the name never arrives.
 */
const TYPED_ANSWER_FIELDS = new Set(["patient_name", "age", "medical_info"]);

/**
 * What the patient can tap on this reply, if anything.
 *
 * The governing rule: whatever is tappable must answer the question actually
 * being asked. That is why this reads `needs` — the model's own statement of
 * what it is waiting for — rather than ranking the structural offers by
 * importance. Ranking them produced a real mismatch: asked "which service?",
 * the patient was shown the two appointment times, because a time outranked
 * a service in a fixed order that had no idea what the sentence above it said.
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
  /** A doctor they already chose — settled, so never asked again. */
  pendingDoctorId?: string;
  /** Eligible doctors for the pending service, soonest-first — for the doctor chooser. */
  doctors?: ButtonDoctor[];
  /** What the model says it is still waiting on. Decides what may be tapped. */
  needs?: readonly string[];
  /** Short answers the model proposed for the question it just asked. */
  choices?: string[];
  canBook: boolean;
  /** True when this turn is already performing the booking. */
  willExecuteAction: boolean;
}): ReplyUi | null {
  // The booking is happening now; anything tappable would invite a second one.
  if (input.willExecuteAction) return null;

  const needs = input.needs ?? [];

  // The question needs typing out. Show nothing: a stale set of time buttons
  // under "what is your name?" is answered by tapping a time, and the name is
  // never given.
  if (needs.some((need) => TYPED_ANSWER_FIELDS.has(need))) return null;

  // Asked which service, show services — even when times are also on offer.
  if (needs.includes("service") && !input.pendingService) {
    const rows = serviceRows(input.services, input.language);
    if (rows.length === 0) return null;
    return {
      kind: "list",
      button: input.language === "ar" ? "اختار الخدمة" : "Choose a service",
      rows,
    };
  }

  // Service → Doctor → Date/time: once the service is settled, the next
  // question is who — before any time is offered, same precedence rule as
  // the service branch above (needs decides, not a fixed ranking).
  if (needs.includes("doctor") && input.pendingService && !input.pendingDoctorId) {
    const rows = doctorRows(input.doctors ?? [], input.language);
    if (rows.length === 0) return null;
    return {
      kind: "list",
      button: input.language === "ar" ? "اختار الدكتور" : "Choose a doctor",
      rows,
    };
  }

  if (input.pendingSlotId) {
    // Never offer to confirm what we are not allowed to write. A confirm button
    // that cannot book is a lie the patient taps.
    return input.canBook ? { kind: "buttons", buttons: confirmButtons(input.language) } : null;
  }

  const slots = slotButtons(input.offeredSlots, input.language);
  if (slots.length > 0) return { kind: "buttons", buttons: slots };

  // Nothing structural to offer, but the reply may still be a question with a
  // few short answers — "move it or add another?", "morning or evening?".
  const choices = choiceButtons(input.choices ?? []);
  if (choices.length > 0) return { kind: "buttons", buttons: choices };

  return null;
}
