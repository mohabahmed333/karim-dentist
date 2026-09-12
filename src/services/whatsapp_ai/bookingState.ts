import {
  CHANGE_ID,
  GENERAL_CONSULTATION,
  NOT_SURE_ID,
} from "./bookingButtons";
import { injectionHeuristics } from "./injectionHeuristics";

export type BookingStep =
  | "idle"
  | "collecting"
  | "awaiting_slot"
  | "awaiting_confirm";

export type PendingBooking = {
  service?: string;
  patientName?: string;
  slotId?: string;
  /** Kept beside the id so the prompt can name the time without a lookup. */
  slotStartsAt?: string;
};

export type BookingState = {
  step: BookingStep;
  pending: PendingBooking;
  expiresAt: string | null;
};

/** What the model reports having learned. Untrusted: it came from patient text. */
export type CollectedFields = {
  service?: string | null;
  patientName?: string | null;
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
function cleanField(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (injectionHeuristics(value).length > 0) return undefined;
  const text = value.replace(/\s+/g, " ").trim().slice(0, MAX_FIELD_LENGTH);
  return text || undefined;
}

function deriveStep(pending: PendingBooking): BookingStep {
  if (pending.service && pending.slotId) return "awaiting_confirm";
  if (pending.service) return "awaiting_slot";
  if (pending.slotId || pending.patientName) return "collecting";
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
  if (typeof stored.slotId === "string" && stored.slotId) {
    pending.slotId = stored.slotId;
    if (typeof stored.slotStartsAt === "string") {
      pending.slotStartsAt = stored.slotStartsAt;
    }
  }

  return { step: deriveStep(pending), pending, expiresAt };
}
