import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/requireAdmin";
import {
  hitsFromCaseStudies,
  hitsFromConversations,
  hitsFromPatients,
  hitsFromProjects,
  hitsFromReservations,
  hitsFromServices,
  hitsFromThreads,
  type CommandHit,
} from "@/features/admin/lib/commandPalette";
import { sanitizeIlike } from "@/services/reservations/listFilters";
import {
  groupReservationsByPatient,
} from "@/services/reservations/patientHistory";
import type { Reservation } from "@/services/reservations/types";

export const dynamic = "force-dynamic";

async function settled<T>(promise: PromiseLike<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

/** Debounced admin command palette search — filters in Supabase, not a full preload. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const qRaw = (searchParams.get("q") ?? "").trim();
  const q = sanitizeIlike(qRaw);
  if (!q) {
    return NextResponse.json({ hits: [] as CommandHit[] });
  }

  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase;

  const [reservations, services, caseStudies, projects, threads, conversations] =
    await Promise.all([
      settled(
        supabase
          .from("reservations")
          .select(
            "id, patient_name, phone, starts_at, service_label, email, status, deleted_at, service_id",
          )
          .is("deleted_at", null)
          .or(
            `patient_name.ilike.%${q}%,phone.ilike.%${q}%,service_label.ilike.%${q}%`,
          )
          .order("starts_at", { ascending: false })
          .limit(40)
          .then(({ data, error }) => {
            if (error) throw error;
            return (data ?? []) as Pick<
              Reservation,
              | "id"
              | "patient_name"
              | "phone"
              | "starts_at"
              | "service_label"
              | "email"
              | "status"
              | "deleted_at"
              | "service_id"
            >[];
          }),
        [],
      ),
      settled(
        supabase
          .from("services")
          .select("id, title, title_ar, is_published, tags")
          .is("deleted_at", null)
          .or(`title.ilike.%${q}%,title_ar.ilike.%${q}%`)
          .order("sort_order", { ascending: true })
          .limit(30)
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
          .or(`title.ilike.%${q}%,title_ar.ilike.%${q}%,slug.ilike.%${q}%`)
          .limit(20)
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
          .or(`title.ilike.%${q}%,title_ar.ilike.%${q}%,slug.ilike.%${q}%`)
          .limit(20)
          .then(({ data, error }) => {
            if (error) throw error;
            return data ?? [];
          }),
        [],
      ),
      settled(
        supabase
          .from("clinic_chat_threads")
          .select("id, title")
          .ilike("title", `%${q}%`)
          .limit(20)
          .then(({ data, error }) => {
            if (error) throw error;
            return data ?? [];
          }),
        [],
      ),
      settled(
        supabase
          .from("whatsapp_conversations")
          .select("id, contact_name, phone_number")
          .or(`contact_name.ilike.%${q}%,phone_number.ilike.%${q}%`)
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .limit(30)
          .then(({ data, error }) => {
            if (error) throw error;
            return data ?? [];
          }),
        [],
      ),
    ]);

  const reservationRows = reservations.map((row) => ({
    ...row,
    deleted_at: row.deleted_at ?? null,
  })) as Reservation[];

  const hits: CommandHit[] = [
    ...hitsFromPatients(groupReservationsByPatient(reservationRows)),
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
    ...hitsFromThreads(
      threads.map((thread) => ({ id: thread.id, title: thread.title ?? "" })),
    ),
    ...hitsFromConversations(conversations),
  ];

  return NextResponse.json({ hits });
}
