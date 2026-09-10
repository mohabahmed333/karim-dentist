import type { ActionAdapter, ActionContext } from "./adapterTypes";
import type { ProposedAction } from "./schemas";

const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
] as const;

type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

function str(value: unknown, fallback = ""): string {
  return value == null ? fallback : String(value);
}

/**
 * PostgREST errors are plain objects, and confirmProposal reports
 * `err instanceof Error ? err.message : "Action failed"` — so rethrow as a real
 * Error or the reason ("Slot is no longer available") never reaches the doctor.
 */
function rpcError(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}

async function loadReservation(ctx: ActionContext, id: string) {
  const { data, error } = await ctx.db
    .from("reservations")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw rpcError(error, "Could not load reservation");
  if (!data) throw new Error("Reservation not found");
  return data as Record<string, unknown>;
}

async function loadSlot(ctx: ActionContext, slotId: string) {
  const { data, error } = await ctx.db
    .from("appointment_slots")
    .select("id,starts_at,status")
    .eq("id", slotId)
    .maybeSingle();
  if (error) throw rpcError(error, "Could not load slot");
  return data as { id: string; starts_at: string; status: string } | null;
}

/** Book a named patient into an open slot. */
export const reservationCreateAdapter: ActionAdapter = {
  kind: "reservation.create",
  write: true,
  async preview(action, ctx) {
    const slotId = str(action.payload.slotId);
    const slot = await loadSlot(ctx, slotId);
    if (!slot) throw new Error("Slot not found");

    const warnings: string[] = [];
    if (slot.status !== "open") warnings.push("Slot is not open — pick another time");
    if (new Date(slot.starts_at).getTime() < Date.now()) {
      warnings.push("Slot is in the past");
    }

    return {
      target: `slot:${slotId}`,
      before: { status: slot.status, starts_at: slot.starts_at },
      after: {
        status: "booked",
        patient_name: str(action.payload.patient_name),
        phone: str(action.payload.phone),
        service_label: str(action.payload.service_label, "General consultation"),
        starts_at: slot.starts_at,
      },
      snapshot: { [`slot:${slotId}`]: slot },
      warnings,
    };
  },
  async execute(action, ctx) {
    const { data, error } = await ctx.db.rpc("book_open_appointment_slot", {
      p_slot_id: str(action.payload.slotId),
      p_patient_name: str(action.payload.patient_name),
      p_phone: str(action.payload.phone),
      p_email: (action.payload.email as string) || null,
      p_service_id: (action.payload.service_id as string) || null,
      p_service_label: str(action.payload.service_label, "General consultation"),
      p_notes: str(action.payload.notes),
    });
    if (error) throw rpcError(error, "Booking failed");
    if (!data) throw new Error("Booking did not return a reservation");
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: "Appointment booked",
      result: { reservationId: data },
    };
  },
};

/** Move an existing reservation onto a different open slot. */
export const reservationRescheduleAdapter: ActionAdapter = {
  kind: "reservation.reschedule",
  write: true,
  async preview(action, ctx) {
    const reservationId = str(action.payload.reservationId ?? action.payload.id);
    const slotId = str(action.payload.slotId);
    const reservation = await loadReservation(ctx, reservationId);
    const slot = await loadSlot(ctx, slotId);
    if (!slot) throw new Error("Slot not found");

    const warnings: string[] = [];
    if (slot.status !== "open") warnings.push("Slot is not open — pick another time");
    if (reservation.status === "cancelled") warnings.push("Reservation is cancelled");

    return {
      target: `reservation:${reservationId}`,
      before: {
        starts_at: reservation.starts_at,
        status: reservation.status,
      },
      after: { starts_at: slot.starts_at, status: reservation.status },
      snapshot: {
        [`reservation:${reservationId}`]: {
          starts_at: reservation.starts_at,
          status: reservation.status,
        },
        [`slot:${slotId}`]: slot,
      },
      warnings,
    };
  },
  async execute(action, ctx) {
    const reservationId = str(action.payload.reservationId ?? action.payload.id);
    const { data, error } = await ctx.db.rpc("reschedule_reservation_to_slot", {
      p_reservation_id: reservationId,
      p_slot_id: str(action.payload.slotId),
      p_phone: (action.payload.phone as string) || null,
    });
    if (error) throw rpcError(error, "Reschedule failed");
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: "Appointment rescheduled",
      result: { reservationId: data ?? reservationId },
    };
  },
};

/** Cancel a reservation and return its slot to the open pool. */
export const reservationCancelAdapter: ActionAdapter = {
  kind: "reservation.cancel",
  write: true,
  async preview(action, ctx) {
    const reservationId = str(action.payload.reservationId ?? action.payload.id);
    const reservation = await loadReservation(ctx, reservationId);
    const warnings =
      reservation.status === "cancelled" ? ["Already cancelled"] : [];
    return {
      target: `reservation:${reservationId}`,
      before: { status: reservation.status },
      after: { status: "cancelled" },
      snapshot: {
        [`reservation:${reservationId}`]: { status: reservation.status },
      },
      warnings,
    };
  },
  async execute(action, ctx) {
    const reservationId = str(action.payload.reservationId ?? action.payload.id);
    const { data, error } = await ctx.db.rpc(
      "cancel_reservation_and_release_slot",
      {
        p_reservation_id: reservationId,
        p_phone: (action.payload.phone as string) || null,
      },
    );
    if (error) throw rpcError(error, "Cancel failed");
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: "Appointment cancelled",
      result: { reservationId: data ?? reservationId },
    };
  },
};

/**
 * Front-desk status moves: confirm, complete, no-show.
 *
 * Cancelling is deliberately NOT routed here — it must also release the slot,
 * which is what reservation.cancel does.
 */
export const reservationSetStatusAdapter: ActionAdapter = {
  kind: "reservation.set_status",
  write: true,
  async preview(action, ctx) {
    const reservationId = str(action.payload.reservationId ?? action.payload.id);
    const status = parseStatus(action.payload.status);
    const reservation = await loadReservation(ctx, reservationId);
    return {
      target: `reservation:${reservationId}`,
      before: { status: reservation.status },
      after: { status },
      snapshot: {
        [`reservation:${reservationId}`]: { status: reservation.status },
      },
    };
  },
  async execute(action, ctx) {
    const reservationId = str(action.payload.reservationId ?? action.payload.id);
    const status = parseStatus(action.payload.status);
    const { error } = await ctx.db
      .from("reservations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", reservationId)
      .is("deleted_at", null);
    if (error) throw rpcError(error, "Status update failed");
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: `Marked ${status}`,
      result: { reservationId, status },
    };
  },
};

export function parseStatus(value: unknown): ReservationStatus {
  const status = str(value).trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (status === "cancelled" || status === "canceled") {
    throw new Error("Use reservation.cancel so the slot is released");
  }
  if (!(RESERVATION_STATUSES as readonly string[]).includes(status)) {
    throw new Error(`Unknown reservation status: ${str(value)}`);
  }
  return status as ReservationStatus;
}

export const reservationAdapters: ActionAdapter[] = [
  reservationCreateAdapter,
  reservationRescheduleAdapter,
  reservationCancelAdapter,
  reservationSetStatusAdapter,
];

export type { ProposedAction };
