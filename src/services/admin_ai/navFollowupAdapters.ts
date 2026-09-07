import type { ActionAdapter } from "./adapterTypes";
import { fdiSchema } from "./schemas";

export const navigateOpenPatientAdapter: ActionAdapter = {
  kind: "navigate.open_patient",
  write: false,
  async preview(action) {
    const patientKey = String(action.payload.patientKey ?? "");
    const href =
      String(action.payload.href ?? "") ||
      `/admin/patients/${encodeURIComponent(patientKey)}`;
    return {
      target: `patient:${patientKey}`,
      before: {},
      after: { href },
      snapshot: { href },
    };
  },
  async execute(action) {
    const patientKey = String(action.payload.patientKey ?? "");
    const href =
      String(action.payload.href ?? "") ||
      `/admin/patients/${encodeURIComponent(patientKey)}`;
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
    const patientKey = String(action.payload.patientKey ?? "");
    const href = patientKey
      ? `/admin/patients/${encodeURIComponent(patientKey)}/workspace?tooth=${fdi}`
      : `?tooth=${fdi}`;
    return {
      target: `tooth:${fdi}`,
      before: {},
      after: { fdi, href },
      snapshot: { fdi },
    };
  },
  async execute(action) {
    const fdi = fdiSchema.parse(action.payload.fdi ?? action.payload.tooth_fdi);
    const patientKey = String(action.payload.patientKey ?? "");
    const href = patientKey
      ? `/admin/patients/${encodeURIComponent(patientKey)}/workspace?tooth=${fdi}`
      : `?tooth=${fdi}`;
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
    const { data: slot, error: slotErr } = await ctx.db
      .from("appointment_slots")
      .select("*")
      .eq("id", slotId)
      .maybeSingle();
    if (slotErr) throw slotErr;
    if (!slot || slot.status !== "open") {
      throw new Error("Slot is not open");
    }
    const { data: reservation, error } = await ctx.db
      .from("reservations")
      .insert({
        patient_name: String(action.payload.patient_name ?? ""),
        phone: String(action.payload.phone ?? ""),
        service_id: (action.payload.service_id as string) || null,
        service_label: String(action.payload.service_label ?? "Follow-up"),
        starts_at: slot.starts_at,
        notes: String(action.payload.notes ?? ""),
        status: "pending",
      })
      .select("*")
      .single();
    if (error) throw error;

    const { error: bookErr } = await ctx.db
      .from("appointment_slots")
      .update({
        status: "booked",
        reservation_id: reservation.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", slotId)
      .eq("status", "open");
    if (bookErr) throw bookErr;

    const treatmentId = action.payload.treatmentId
      ? String(action.payload.treatmentId)
      : null;
    if (treatmentId) {
      await ctx.db
        .from("patient_treatments")
        .update({
          status: "scheduled",
          reservation_id: reservation.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", treatmentId);
    }

    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: "Follow-up booked",
      result: reservation as Record<string, unknown>,
    };
  },
};
