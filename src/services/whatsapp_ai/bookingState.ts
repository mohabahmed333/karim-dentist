import {
  ANY_DOCTOR_ID,
  CHANGE_ID,
  GENERAL_CONSULTATION,
  NOT_SURE_ID,
} from "./bookingButtons";
import { injectionHeuristics } from "./injectionHeuristics";

export type BookingStep =
  | "idle"
  | "collecting"
  | "awaiting_doctor"
  | "awaiting_slot"
  | "awaiting_confirm";

export type PendingBooking = {
  service?: string;
  patientName?: string;
  /** Free text, patient-reported. Never validated against anything. */
  age?: string;
  /**
   * What the patient said about existing conditions or medication, or a
   * settled "none"/"not provided" once asked. Recorded for the dentist to
   * read before the visit — never something the assistant reacts to.
   */
  medicalInfo?: string;
  doctorId?: string;
  /** Kept beside the id so the prompt can name the doctor without a lookup. */
  doctorName?: string;
  slotId?: string;
  /** Kept beside the id so the prompt can name the time without a lookup. */
  slotStartsAt?: string;
};

/** A doctor the server actually offered, so a tap or a report can be checked against it. */
export type OfferedDoctor = { id: string; name: string };

export type BookingState = {
  step: BookingStep;
  pending: PendingBooking;
  expiresAt: string | null;
};

/** What the model reports having learned. Untrusted: it came from patient text. */
export type CollectedFields = {
  service?: string | null;
  patientName?: string | null;
  age?: string | null;
  medicalInfo?: string | null;
  doctorId?: string | null;
  slotId?: string | null;
};

const STATE_TTL_MS = 30 * 60_000;
const MAX_FIELD_LENGTH = 120;

function emptyState(): BookingState {
  return { step: "idle", pending: {}, expiresAt: null };
}

/**
 * Normalise one untrusted value, or reject it.
 *
 * These values are rendered back into the system prompt next turn, which makes
 * them patient text reaching the model's instructions by a side door. The
 * injection check runs on the raw value: collapsing whitespace first would hide
 * a "system:" role marker that only matches at the start of a line.
 */
function cleanField(value: unknown, maxLength: number = MAX_FIELD_LENGTH): string | undefined {
  if (typeof value !== "string") return undefined;
  if (injectionHeuristics(value).length > 0) return undefined;
  const text = value.replace(/\s+/g, " ").trim().slice(0, maxLength);
  return text || undefined;
}

/** Longer cap: a medical note is a sentence, not a name. */
const MAX_MEDICAL_LENGTH = 300;

function deriveStep(pending: PendingBooking): BookingStep {
  if (pending.service && pending.doctorId && pending.slotId) return "awaiting_confirm";
  if (pending.service && pending.doctorId) return "awaiting_slot";
  if (pending.service) return "awaiting_doctor";
  if (pending.slotId || pending.doctorId || pending.patientName) return "collecting";
  return "idle";
}

/**
 * Fold what the model learned this turn into the booking so far.
 *
 * Pure. A reported value overwrites (the patient may change their mind), a
 * blank one never erases, and a slot is accepted only if the server offered it
 * — so the model cannot plant an id. Nothing is cleared by an unrelated
 * question mid-booking; only a completed booking resets the state.
 */
export function nextBookingState(
  current: BookingState | null,
  input: {
    intent?: string;
    collected: CollectedFields;
    offeredSlots: { id: string; starts_at: string }[];
    /** Doctors actually offered this turn — a reported id not on this list is ignored. */
    offeredDoctors?: OfferedDoctor[];
    /**
     * The doctor already on the reservation being rescheduled, when there is
     * exactly one and it is unambiguous which one that is (see
     * decideAutoReply's own "more than one -> don't guess" rule, mirrored
     * here). Seeds pending.doctorId only when nothing has picked a doctor
     * yet, so continuity of care is the default on a reschedule but an
     * explicit switch — a tap, or the model reporting a different
     * collected.doctorId — always wins.
     */
    activeReservationDoctor?: OfferedDoctor | null;
    bookingCompleted: boolean;
    now: Date;
  },
): BookingState {
  if (input.bookingCompleted) return emptyState();

  const base = current ?? emptyState();
  const pending: PendingBooking = { ...base.pending };
  let changed = false;

  const service = cleanField(input.collected.service);
  if (service) {
    pending.service = service;
    changed = true;
  }

  const patientName = cleanField(input.collected.patientName);
  if (patientName) {
    pending.patientName = patientName;
    changed = true;
  }

  const age = cleanField(input.collected.age);
  if (age) {
    pending.age = age;
    changed = true;
  }

  const medicalInfo = cleanField(input.collected.medicalInfo, MAX_MEDICAL_LENGTH);
  if (medicalInfo) {
    pending.medicalInfo = medicalInfo;
    changed = true;
  }

  const doctorId = cleanField(input.collected.doctorId);
  const doctor = doctorId
    ? (input.offeredDoctors ?? []).find((d) => d.id === doctorId)
    : undefined;
  if (doctor) {
    pending.doctorId = doctor.id;
    pending.doctorName = doctor.name;
    changed = true;
  } else if (
    input.intent === "booking_reschedule" &&
    !pending.doctorId &&
    input.activeReservationDoctor
  ) {
    pending.doctorId = input.activeReservationDoctor.id;
    pending.doctorName = input.activeReservationDoctor.name;
    changed = true;
  }

  const slotId = cleanField(input.collected.slotId);
  const slot = slotId
    ? input.offeredSlots.find((s) => s.id === slotId)
    : undefined;
  if (slot) {
    pending.slotId = slot.id;
    pending.slotStartsAt = slot.starts_at;
    changed = true;
  }

  return {
    step: deriveStep(pending),
    pending,
    expiresAt: changed
      ? new Date(input.now.getTime() + STATE_TTL_MS).toISOString()
      : base.expiresAt,
  };
}

/** A button the patient pressed: the id we put on it, and what it read. */
export type TapChoice = { buttonId?: string | null; title?: string | null };

/**
 * Record what a tapped button means, before the model is asked anything.
 *
 * The server put the id on the button, so the server knows what it meant —
 * there is nothing to infer. Left to the model, a patient who tapped
 * "مش متأكد" was asked which service they wanted all over again, because the
 * model saw only the words and did not connect them to the rule. A tap is a
 * fact; only its interpretation was ever in doubt.
 *
 * Pure, and applied before the prompt is built, so the model is told the choice
 * is settled rather than asked to work it out.
 */
export function applyTap(
  current: BookingState | null,
  tap: TapChoice | null | undefined,
  offeredSlots: { id: string; starts_at: string }[],
  now: Date,
  offeredDoctors: OfferedDoctor[] = [],
): BookingState {
  const base = current ?? emptyState();
  const buttonId = typeof tap?.buttonId === "string" ? tap.buttonId : "";
  if (!buttonId) return base;

  const pending: PendingBooking = { ...base.pending };
  let changed = false;

  if (buttonId.startsWith("slot:")) {
    // Still checked against what the server offered: the id came back from the
    // patient's phone, and nothing from there is taken on trust.
    const slot = offeredSlots.find((s) => s.id === buttonId.slice("slot:".length));
    if (slot) {
      pending.slotId = slot.id;
      pending.slotStartsAt = slot.starts_at;
      changed = true;
    }
  } else if (buttonId === NOT_SURE_ID) {
    pending.service = GENERAL_CONSULTATION;
    changed = true;
  } else if (buttonId.startsWith("service:")) {
    // The row's own title is the service name, and we wrote it.
    const service = cleanField(tap?.title);
    if (service) {
      pending.service = service;
      changed = true;
    }
  } else if (buttonId === ANY_DOCTOR_ID) {
    // "No preference" — the list is already soonest-first (the RPC's own
    // ordering), so the first entry is "earliest available" by construction.
    const soonest = offeredDoctors[0];
    if (soonest) {
      pending.doctorId = soonest.id;
      pending.doctorName = soonest.name;
      changed = true;
    }
  } else if (buttonId.startsWith("doctor:")) {
    const doctor = offeredDoctors.find(
      (d) => d.id === buttonId.slice("doctor:".length),
    );
    if (doctor) {
      pending.doctorId = doctor.id;
      pending.doctorName = doctor.name;
      changed = true;
    }
  } else if (buttonId === CHANGE_ID) {
    // "Another time" — let go of the slot, keep everything else.
    delete pending.slotId;
    delete pending.slotStartsAt;
    changed = true;
  }

  if (!changed) return base;
  return {
    step: deriveStep(pending),
    pending,
    expiresAt: new Date(now.getTime() + STATE_TTL_MS).toISOString(),
  };
}

/**
 * Read stored state, treating an expired or malformed row as a fresh start.
 *
 * A booking abandoned an hour ago must not be resumed as if it were live, and a
 * corrupt jsonb value must not throw inside the reply path.
 */
export function readBookingState(
  row: {
    step?: unknown;
    pending?: unknown;
    state_expires_at?: string | null;
  } | null,
  now: Date,
): BookingState {
  if (!row) return emptyState();

  const expiresAt = row.state_expires_at ?? null;
  if (expiresAt && Date.parse(expiresAt) <= now.getTime()) return emptyState();

  const raw = row.pending;
  const stored =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const pending: PendingBooking = {};
  const service = cleanField(stored.service);
  if (service) pending.service = service;
  const patientName = cleanField(stored.patientName);
  if (patientName) pending.patientName = patientName;
  const age = cleanField(stored.age);
  if (age) pending.age = age;
  const medicalInfo = cleanField(stored.medicalInfo, MAX_MEDICAL_LENGTH);
  if (medicalInfo) pending.medicalInfo = medicalInfo;
  if (typeof stored.doctorId === "string" && stored.doctorId) {
    pending.doctorId = stored.doctorId;
    if (typeof stored.doctorName === "string") {
      pending.doctorName = stored.doctorName;
    }
  }
  if (typeof stored.slotId === "string" && stored.slotId) {
    pending.slotId = stored.slotId;
    if (typeof stored.slotStartsAt === "string") {
      pending.slotStartsAt = stored.slotStartsAt;
    }
  }

  return { step: deriveStep(pending), pending, expiresAt };
}
