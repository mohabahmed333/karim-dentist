import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  CLINIC_LOCATION,
  clinicContactFromSettings,
} from "@/lib/clinic/whatsappClinicContact";
import { loadUpcomingReservations } from "@/services/reservations/upcomingReservations";
import type { ClinicHoursInput } from "@/services/whatsapp_ai/formatClinicHours";
import type { QuickReplyValues } from "./quickReplyFields";
import { buildQuickReplyValues, type QuickReplyLanguage } from "./quickReplyValues";

/**
 * Field values for one conversation, or null when it does not exist.
 *
 * Runs as the signed-in admin (RLS applies), not the service role: staff can
 * only fill a reply with data they could already open themselves.
 */
export async function loadQuickReplyContext(
  db: SupabaseClient<Database>,
  conversationId: string,
  lang: QuickReplyLanguage,
): Promise<QuickReplyValues | null> {
  const { data: conversation } = await db
    .from("whatsapp_conversations")
    .select("phone_number,contact_name,patient_key")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conversation) return null;

  const [reservations, profile, { data: settings }, { data: hours }] = await Promise.all([
    loadUpcomingReservations(db, conversation.phone_number, 1),
    conversation.patient_key
      ? db
          .from("patient_profiles")
          .select("display_name")
          .eq("patient_key", conversation.patient_key)
          .maybeSingle()
          .then((result) => result.data)
      : Promise.resolve(null),
    db
      .from("site_settings")
      .select("contact_phone, contact_address, contact_clinic_name")
      .limit(1)
      .maybeSingle(),
    db
      .from("clinic_hours")
      .select("open_weekdays,time_windows,timezone")
      .limit(1)
      .maybeSingle(),
  ]);

  return buildQuickReplyValues({
    lang,
    contactName: conversation.contact_name,
    patientDisplayName: profile?.display_name ?? null,
    reservations,
    clinic: clinicContactFromSettings(settings),
    hours: hours as ClinicHoursInput | null,
    location: CLINIC_LOCATION,
  });
}
