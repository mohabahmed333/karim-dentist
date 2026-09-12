import type { ActionAdapter } from "./adapterTypes";
import { hrefForNavAction } from "./navHref";
import { fdiSchema } from "./schemas";

export const navigateOpenPatientAdapter: ActionAdapter = {
  kind: "navigate.open_patient",
  write: false,
  async preview(action) {
    const patientKey = String(action.payload.patientKey ?? "");
    const href = hrefForNavAction(action) ?? "/admin/patients";
    return {
      target: `patient:${patientKey}`,
      before: {},
      after: { href },
      snapshot: { href },
    };
  },
  async execute(action) {
    const patientKey = String(action.payload.patientKey ?? "");
    const href = hrefForNavAction(action) ?? "/admin/patients";
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: "Open patient",
      result: { href, patientKey },
    };
  },
};

export const navigateFocusToothAdapter: ActionAdapter = {
  kind: "navigate.focus_tooth",
  write: false,
  async preview(action) {
    const fdi = fdiSchema.parse(action.payload.fdi ?? action.payload.tooth_fdi);
    const href = hrefForNavAction(action) ?? `?tooth=${fdi}`;
    return {
      target: `tooth:${fdi}`,
      before: {},
      after: { fdi, href },
      snapshot: { fdi },
    };
  },
  async execute(action) {
    const fdi = fdiSchema.parse(action.payload.fdi ?? action.payload.tooth_fdi);
    const href = hrefForNavAction(action) ?? `?tooth=${fdi}`;
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: `Focus tooth ${fdi}`,
      result: { fdi, href },
    };
  },
};

export const followupBookAdapter: ActionAdapter = {
  kind: "followup.book",
  write: true,
  async preview(action, ctx) {
    const slotId = String(action.payload.slotId ?? "");
    const { data: slot, error } = await ctx.db
      .from("appointment_slots")
      .select("id,starts_at,status")
      .eq("id", slotId)
      .maybeSingle();
    if (error) throw error;
    if (!slot || slot.status !== "open") {
      throw new Error("Slot is not open — pick another time");
    }
    return {
      target: `slot:${slotId}`,
      before: { status: slot.status, starts_at: slot.starts_at },
      after: {
        status: "booked",
        patient_name: action.payload.patient_name,
        service_label: action.payload.service_label,
        treatment_id: action.payload.treatmentId ?? null,
      },
      snapshot: { [slotId]: slot },
    };
  },
  async execute(action, ctx) {
    const slotId = String(action.payload.slotId ?? "");

    // Atomic: the RPC locks the slot (SELECT … FOR UPDATE), re-checks that it
    // is still open and not in the past, inserts the reservation, and flips the
    // slot in one transaction. The previous insert-then-update here was not
    // atomic, and worse, a zero-row UPDATE is not a Supabase error — so a lost
    // race left an orphan reservation with the slot still open, and reported
    // success.
    const { data: reservationId, error } = await ctx.db.rpc(
      "book_open_appointment_slot",
      {
        p_slot_id: slotId,
        p_patient_name: String(action.payload.patient_name ?? ""),
        p_phone: String(action.payload.phone ?? ""),
        p_email: null,
        p_service_id: (action.payload.service_id as string) || null,
        p_service_label: String(action.payload.service_label ?? "Follow-up"),
        p_notes: String(action.payload.notes ?? ""),
      },
    );
    // Rethrow as a real Error: confirmProposal reports `err instanceof Error
    // ? err.message : "Action failed"`, so a raw PostgrestError would hide
    // "Slot is no longer available" from the doctor confirming the booking.
    if (error) throw new Error(error.message || "Booking failed");
    if (!reservationId) throw new Error("Booking did not return a reservation");

    const treatmentId = action.payload.treatmentId
      ? String(action.payload.treatmentId)
      : null;
    if (treatmentId) {
      await ctx.db
        .from("patient_treatments")
        .update({
          status: "scheduled",
          reservation_id: reservationId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", treatmentId);
    }

    const { data: reservation } = await ctx.db
      .from("reservations")
      .select("*")
      .eq("id", reservationId)
      .maybeSingle();

    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: "Follow-up booked",
      result: (reservation ?? { id: reservationId }) as Record<string, unknown>,
    };
  },
};
