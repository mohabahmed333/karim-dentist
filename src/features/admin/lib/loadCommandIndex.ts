import { createClient } from "@/lib/supabase/client";
import { listThreads } from "@/services/clinic_chat/queries";
import { listReservations } from "@/services/reservations/queries";
import { groupReservationsByPatient } from "@/services/reservations/patientHistory";
import {
  hitsFromCaseStudies,
  hitsFromConversations,
  hitsFromPatients,
  hitsFromProjects,
  hitsFromReservations,
  hitsFromServices,
  hitsFromThreads,
  type CommandHit,
} from "./commandPalette";

async function settled<T>(promise: PromiseLike<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export async function loadCommandIndex(): Promise<CommandHit[]> {
  const supabase = createClient();

  const [reservations, services, caseStudies, projects, threads, conversations] =
    await Promise.all([
      settled(listReservations(), []),
      settled(
        supabase
          .from("services")
          .select("id, title, title_ar, is_published, tags")
          .is("deleted_at", null)
          .then(({ data, error }) => {
            if (error) throw error;
            return data ?? [];
          }),
        [],
      ),
      settled(
        supabase
          .from("case_studies")
          .select("id, title, title_ar, slug, is_published, tags")
          .is("deleted_at", null)
          .then(({ data, error }) => {
            if (error) throw error;
            return data ?? [];
          }),
        [],
      ),
      settled(
        supabase
          .from("featured_projects")
          .select("id, title, title_ar, slug, is_published")
          .is("deleted_at", null)
          .then(({ data, error }) => {
            if (error) throw error;
            return data ?? [];
          }),
        [],
      ),
      settled(listThreads(), []),
      settled(
        supabase
          .from("whatsapp_conversations")
          .select("id, contact_name, phone_number")
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .limit(80)
          .then(({ data, error }) => {
            if (error) throw error;
            return data ?? [];
          }),
        [],
      ),
    ]);

  return [
    ...hitsFromPatients(groupReservationsByPatient(reservations)),
    ...hitsFromReservations(
      reservations.map((row) => ({
        id: row.id,
        patient_name: row.patient_name,
        phone: row.phone,
        starts_at: row.starts_at,
        service: row.service_label,
      })),
    ),
    ...hitsFromServices(services),
    ...hitsFromCaseStudies(caseStudies),
    ...hitsFromProjects(projects),
    ...hitsFromThreads(threads.map((thread) => ({ id: thread.id, title: thread.title }))),
    ...hitsFromConversations(conversations),
  ];
}
