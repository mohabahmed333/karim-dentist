import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
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
  patientKeysForDoctor,
} from "@/services/reservations/patientHistory";
import { listReservationsServer } from "@/services/reservations/queries";
import { listAllServiceDoctorMappings } from "@/services/service_doctors/queries";
import type { Service } from "@/services/services/types";
import { loadMyDayPatientBundle } from "@/services/my_day/actions";

export const dynamic = "force-dynamic";

export default async function AdminMyDayPage() {
  const session = await requirePagePermission("patients.view");
  const supabase = await createClient();
  const today = localTodayIso();
  const scopeToDoctor = session.isDoctor;

  const [
    todaysReservations,
    allReservations,
    doctors,
    services,
    serviceDoctorMappings,
  ] = await Promise.all([
    listReservationsServer(supabase, {
      from: today,
      to: today,
      // A doctor sees their own day, plus anything not yet assigned to anyone.
      doctorId: scopeToDoctor ? session.user!.id : undefined,
      includeUnassigned: scopeToDoctor,
      sort: "starts_at",
      dir: "asc",
    }).catch(() => []),
    // Unfiltered: the patient's whole visit history feeds the chart, the EHR
    // timeline and the billing dialog, not just today.
    listReservationsServer(supabase).catch(() => []),
    listDoctors(supabase).catch(() => []),
    // Clinic-wide, so loaded once here rather than per patient — the workspace
    // needs them to price and assign a proposed treatment.
    (async () => {
      try {
        const { data } = await supabase
          .from("services")
          .select("*")
          .is("deleted_at", null)
          .order("sort_order", { ascending: true });
        return (data ?? []) as Service[];
      } catch {
        return [] as Service[];
      }
    })(),
    listAllServiceDoctorMappings(supabase).catch(() => ({})),
  ]);

  // A doctor's directory is narrowed to patients they have actually seen, or
  // who are not assigned to anyone. The history *within* such a patient stays
  // whole — including visits with other doctors — because treating someone
  // without their full chart is worse than the disclosure.
  const allGroups = groupReservationsByPatient(allReservations);
  const directory = scopeToDoctor
    ? (() => {
        const mine = patientKeysForDoctor(allReservations, session.user!.id);
        return allGroups.filter((group) => mine.has(group.patientKey));
      })()
    : allGroups;

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
    // No page header: the topbar breadcrumb already says "My Day", and this
    // screen is a cockpit rather than a document — the ~80px a title band
    // costs is better spent on the chart.
    <AdminPageMotion className="flex min-h-0 flex-1 flex-col">
      <MyDayView
        todaysReservations={todaysReservations}
        directory={directory}
        initialReservationId={current?.id ?? null}
        initialBundle={initialBundle}
        currentDoctorId={scopeToDoctor ? session.user!.id : null}
        canPickDoctor={!scopeToDoctor}
        canPropose={session.permissions.has("patients.treatments.edit")}
        canEditBilling={session.permissions.has("patients.billing.edit")}
        canBook={
          session.permissions.has("reservations.create") &&
          session.permissions.has("reservations.edit")
        }
        canEditProfile={session.permissions.has("patients.edit")}
        canViewInbox={session.permissions.has("support.view")}
        showDoctor={!scopeToDoctor}
        doctorNameById={doctorNameById}
        doctors={doctors}
        services={services}
        serviceDoctorMappings={serviceDoctorMappings}
      />
    </AdminPageMotion>
  );
}
