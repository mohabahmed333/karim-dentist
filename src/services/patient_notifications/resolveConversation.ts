/**
 * Find the WhatsApp conversation a notification belongs in, or start one.
 *
 * A patient who booked on the website may never have messaged the clinic, so
 * there is often no conversation row at all. Getting this wrong in the other
 * direction is worse than missing: two rows for one number means the reminder
 * lands in one thread and the patient's reply arrives in another, and the
 * cancel-by-reply flow silently stops working.
 */

import {
  canonicalPhoneDigits,
  phonesMatch,
} from "@/services/reservations/patientHistory";
import { phoneSuffixForLookup } from "@/services/reservations/phoneSuffix";

export type ConversationCandidate = {
  id: string;
  phone_number: string;
  updated_at: string | null;
};

/**
 * Choose which of the suffix-matched rows actually belongs to `phone`.
 *
 * The SQL prefilter compares only the last 8 digits, so unrelated foreign
 * numbers can share a suffix. `phonesMatch` makes the real decision, exactly as
 * `resolvePatientKeyByPhone` does for reservations.
 */
export function pickConversation(
  candidates: ConversationCandidate[],
  phone: string,
): ConversationCandidate | null {
  let best: ConversationCandidate | null = null;
  for (const row of candidates) {
    if (!phonesMatch(row.phone_number, phone)) continue;
    // Most recently active wins: that is the thread the patient is actually in.
    if (!best || (row.updated_at ?? "") > (best.updated_at ?? "")) best = row;
  }
  return best;
}

export type ResolveConversationDeps = {
  findBySuffix: (suffix: string) => Promise<ConversationCandidate[]>;
  create: (input: {
    phone_number: string;
    contact_name: string;
    status: "active";
  }) => Promise<{ id: string }>;
};

export type ResolveConversationInput = {
  phone: string;
  patientName: string;
};

export async function resolveOrCreateConversation(
  deps: ResolveConversationDeps,
  input: ResolveConversationInput,
): Promise<string> {
  const suffix = phoneSuffixForLookup(input.phone);
  const digits = canonicalPhoneDigits(input.phone);
  if (!suffix || !digits) {
    throw new Error(`Cannot resolve a conversation for phone "${input.phone}"`);
  }

  const existing = pickConversation(await deps.findBySuffix(suffix), input.phone);
  if (existing) return existing.id;

  const created = await deps.create({
    // Bare digits including the country code — the shape Kapso reports in
    // `message.from`. upsertConversationFromKapso still falls back to an exact
    // match on phone_number, so storing "+2010…" here would fork the thread the
    // moment the patient replies.
    phone_number: digits,
    contact_name: input.patientName,
    status: "active",
    // Deliberately no last_inbound_at: isWhatsappSessionOpen reads it, and
    // inventing one would let free text out to someone who has never written
    // to the clinic — a Meta policy violation, not just a bug.
  });
  return created.id;
}
