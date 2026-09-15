"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { listPatientLedger } from "@/services/patient_billing/queries";
import { listPatientImagingServer } from "@/services/patient_imaging/queries";
import type { PatientImaging } from "@/services/patient_imaging";
import { listToothNotesServer } from "@/services/patient_tooth_notes/queries";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import { listPatientTreatmentsServer } from "@/services/patient_treatments";
import type { PatientTreatmentRow } from "@/services/patient_treatments";
import { listReservationsServer } from "@/services/reservations/queries";
import { patientKeysForDoctor } from "@/services/reservations/patientHistory";

export type MyDayPatientBundle = {
  patientKey: string;
  notes: PatientToothNote[];
  imaging: PatientImaging[];
  /**
   * Raw rows, not mapped `TreatmentItem`s. The embedded clinical workspace
   * edits these directly; the read-only history tab maps them itself.
   */
  treatments: PatientTreatmentRow[];
  balance: number;
};

/**
 * Everything the doctor's day view shows about one patient, in a single round
 * trip.
 *
 * Read server-side rather than from the browser because the ledger has no
 * browser-safe path — it reconciles deposits against reservations. Gathering
 * the rest here too keeps a patient switch to one request instead of four.
 *
 * Every leg degrades on its own. A patient with no imaging or no ledger should
 * still get a usable page rather than an error screen.
 */
export async function loadMyDayPatientBundle(input: {
  patientKey: string;
  /** This patient's visits, for the ledger's deposit matching. */
  reservationIds: string[];
}): Promise<MyDayPatientBundle> {
  const auth = await requirePermission("patients.view");
  if (auth.error || !auth.session) throw new Error("Forbidden");
  const supabase = auth.supabase;
  const { patientKey, reservationIds } = input;

  await assertPatientInScope(auth.session, supabase, patientKey);

  const [notes, imaging, treatments, ledger] = await Promise.all([
    listToothNotesServer(supabase, patientKey).catch(() => []),
    listPatientImagingServer(supabase, patientKey).catch(() => []),
    listPatientTreatmentsServer(supabase, patientKey).catch(() => []),
    listPatientLedger(supabase, patientKey, reservationIds).catch(() => ({
      entries: [],
      balance: 0,
    })),
  ]);

  return { patientKey, notes, imaging, treatments, balance: ledger.balance };
}

type ServerSupabase = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

type Session = { isDoctor: boolean; user: { id: string } };

/**
 * A doctor may only load a patient they have actually seen.
 *
 * This is the enforcement point, not a second opinion on the page's filter.
 * `patientKey` arrives from the browser, and row-level security will not catch
 * a forged one: the `doctor` role carries `is_admin_role = true`, so every
 * `USING (is_admin())` policy in the database admits it. Without this check a
 * doctor could read any patient in the clinic by editing one string.
 *
 * Non-doctors (owner, front desk) are clinic-wide by design and skip it.
 */
async function assertPatientInScope(
  session: Session,
  supabase: ServerSupabase,
  patientKey: string,
): Promise<void> {
  if (!session.isDoctor) return;

  const reservations = await listReservationsServer(supabase).catch(() => []);
  const allowed = patientKeysForDoctor(reservations, session.user.id);
  if (!allowed.has(patientKey)) throw new Error("Forbidden");
}
