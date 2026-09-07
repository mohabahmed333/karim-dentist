import {
  getPatientGroup,
  groupReservationsByPatient,
} from "@/services/reservations/patientHistory";
import { listReservationsServer } from "@/services/reservations/queries";
import {
  assembleDentalChart,
  buildPatientProfile,
} from "@/services/dental_chart";
import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export async function loadDentalChart(supabase: ServerClient, patientId: string) {
  const key = decodeURIComponent(patientId);
  const reservations = await listReservationsServer(supabase).catch(() => []);
  const group = getPatientGroup(groupReservationsByPatient(reservations), key);
  if (!group) return null;
  const visits = group.visits.filter((row) => row.deleted_at === null);
  return assembleDentalChart(
    buildPatientProfile(group.patientKey, group.displayName),
    visits,
  );
}
