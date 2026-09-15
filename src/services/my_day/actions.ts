"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { listPatientLedger } from "@/services/patient_billing/queries";
import { listPatientImagingServer } from "@/services/patient_imaging/queries";
import type { PatientImaging } from "@/services/patient_imaging";
import { listToothNotesServer } from "@/services/patient_tooth_notes/queries";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import { listPatientTreatmentsServer } from "@/services/patient_treatments";
import { toTreatmentItem, type TreatmentItem } from "@/services/patient_treatments";
import { findConversationForPatient, listMessagesPage } from "@/services/whatsapp/queries";
import { mapWhatsappToSupportUi } from "@/features/admin/components/support/supportWhatsappMap";
import type { SupportMessage } from "@/features/admin/components/support/supportDummyData";

/** How far back the read-only thread goes. One screenful of context, not an archive. */
const CHAT_PAGE_SIZE = 50;

export type MyDayChat = {
  conversationId: string;
  contactName: string;
  messages: SupportMessage[];
};

export type MyDayPatientBundle = {
  patientKey: string;
  notes: PatientToothNote[];
  imaging: PatientImaging[];
  treatments: TreatmentItem[];
  balance: number;
  /** Null when this patient has never messaged the clinic — the common case. */
  chat: MyDayChat | null;
};

/**
 * Everything the doctor's day view shows about one patient, in a single round
 * trip.
 *
 * Read server-side rather than from the browser because two of these legs have
 * no browser-safe path: the ledger, and the WhatsApp thread — the front-desk
 * message API is gated on `support.view`, which doctors do not have. RLS on
 * the WhatsApp tables allows any staff profile, so a patient-scoped read here
 * is both permitted and narrow: one patient's thread, never the clinic inbox.
 *
 * Every leg degrades on its own. A patient with no imaging, no ledger or a
 * WhatsApp hiccup should still get a usable page rather than an error screen.
 */
export async function loadMyDayPatientBundle(input: {
  patientKey: string;
  /** Used to find their WhatsApp thread when nothing links it by patient_key yet. */
  phone: string;
  /** This patient's visits, for the ledger's deposit matching. */
  reservationIds: string[];
}): Promise<MyDayPatientBundle> {
  const auth = await requirePermission("patients.view");
  if (auth.error) throw new Error("Forbidden");
  const supabase = auth.supabase;
  const { patientKey, phone, reservationIds } = input;

  const [notes, imaging, treatmentRows, ledger, chat] = await Promise.all([
    listToothNotesServer(supabase, patientKey).catch(() => []),
    listPatientImagingServer(supabase, patientKey).catch(() => []),
    listPatientTreatmentsServer(supabase, patientKey).catch(() => []),
    listPatientLedger(supabase, patientKey, reservationIds).catch(() => ({
      entries: [],
      balance: 0,
    })),
    loadChat(supabase, patientKey, phone).catch(() => null),
  ]);

  return {
    patientKey,
    notes,
    imaging,
    treatments: treatmentRows.map(toTreatmentItem),
    balance: ledger.balance,
    chat,
  };
}

type ServerSupabase = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

/**
 * The patient's thread, mapped through the same transform the front-desk inbox
 * uses — `SupportMessage` carries media, reply quotes, interactive cards and
 * voice notes, so a hand-rolled mapper would quietly flatten half of them.
 */
async function loadChat(
  supabase: ServerSupabase,
  patientKey: string,
  phone: string,
): Promise<MyDayChat | null> {
  const conversation = await findConversationForPatient(supabase, { patientKey, phone });
  if (!conversation) return null;

  const { messages } = await listMessagesPage(supabase, conversation.id, {
    limit: CHAT_PAGE_SIZE,
  });
  const mapped = mapWhatsappToSupportUi([conversation], {
    [conversation.id]: messages,
  });

  return {
    conversationId: conversation.id,
    contactName: conversation.contact_name?.trim() || conversation.phone_number,
    messages: mapped.messagesById[conversation.id] ?? [],
  };
}
