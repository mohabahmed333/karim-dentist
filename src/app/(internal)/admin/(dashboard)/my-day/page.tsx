import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { MyDayView } from "@/features/admin/components/my-day/MyDayView";
import { localTodayIso } from "@/features/admin/lib/calendarDayBooking";
import { pickCurrentReservation } from "@/features/admin/lib/dayScheduleModel";
import { requirePagePermission } from "@/lib/auth/pageGuard";
import { createClient } from "@/lib/supabase/server";
import { listDoctors } from "@/services/profiles";
import {
  getPatientGroup,
  groupReservationsByPatient,
  patientKeyFromReservation,
} from "@/services/reservations/patientHistory";
import { listReservationsServer } from "@/services/reservations/queries";
import { loadMyDayPatientBundle } from "@/services/my_day/actions";

export const dynamic = "force-dynamic";

export default async function AdminMyDayPage() {
  const session = await requirePagePermission("patients.view");
  const supabase = await createClient();
  const today = localTodayIso();
  const scopeToDoctor = session.isDoctor;

  const [todaysReservations, allReservations, doctors] = await Promise.all([
    listReservationsServer(supabase, {
      from: today,
      to: today,
      // A doctor sees their own day, plus anything not yet assigned to anyone.
      doctorId: scopeToDoctor ? session.user!.id : undefined,
      includeUnassigned: scopeToDoctor,
      sort: "starts_at",
      dir: "asc",
      limit: 200,
    }).catch(() => []),
    // Unfiltered: the patient's whole visit history feeds the EHR timeline and
    // the billing dialog, not just today.
    listReservationsServer(supabase).catch(() => []),
    listDoctors(supabase).catch(() => []),
  ]);

  const directory = groupReservationsByPatient(allReservations);
  const current = pickCurrentReservation(todaysReservations, new Date());
  const currentGroup = current
    ? getPatientGroup(directory, patientKeyFromReservation(current))
    : null;

  // Loaded here rather than on the client so the patient who is actually in the
  // chair paints complete, with no spinner on arrival.
  const initialBundle = currentGroup
    ? await loadMyDayPatientBundle({
        patientKey: currentGroup.patientKey,
        phone: currentGroup.phone,
        reservationIds: currentGroup.visits.map((v) => v.id),
      }).catch(() => null)
    : null;

  const doctorNameById = Object.fromEntries(
    doctors.map((d) => [d.id, d.display_name ?? ""]),
  );

  return (
    <AdminPageMotion className="flex min-h-0 flex-1 flex-col space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.pages.myDay.title"
        descriptionKey="admin.pages.myDay.description"
      />
      <MyDayView
        todaysReservations={todaysReservations}
        directory={directory}
        initialReservationId={current?.id ?? null}
        initialBundle={initialBundle}
        currentDoctorId={scopeToDoctor ? session.user!.id : null}
        canPickDoctor={!scopeToDoctor}
        canPropose={session.permissions.has("patients.treatments.edit")}
        showDoctor={!scopeToDoctor}
        doctorNameById={doctorNameById}
      />
    </AdminPageMotion>
  );
}
