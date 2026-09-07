import type { ClinicChatAction } from "@/services/clinic_chat";
import type { Reservation } from "@/services/reservations/types";
import {
  encodePatientKey,
  groupReservationsByPatient,
  normalizePhone,
  patientKeyFromReservation,
  phonesMatch,
} from "@/services/reservations/patientHistory";

export function stamp(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function timeKey(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function todayReservations(rows: Reservation[]): Reservation[] {
  const today = dayKey(new Date().toISOString());
  return rows.filter(
    (r) => !r.deleted_at && dayKey(r.starts_at) === today,
  );
}

export function pendingReservations(rows: Reservation[]): Reservation[] {
  return rows.filter((r) => !r.deleted_at && r.status === "pending");
}

function reservationMatchesPatient(
  row: Reservation,
  opts: { patientKey?: string; phone?: string },
): boolean {
  const key = opts.patientKey?.trim() ?? "";
  const phone = opts.phone?.trim() ?? "";
  if (key && patientKeyFromReservation(row) === key) return true;
  if (phone && phonesMatch(row.phone, phone)) return true;
  if (key.startsWith("phone:") && phonesMatch(row.phone, key.slice(6))) {
    return true;
  }
  if (key.startsWith("wa:") && phonesMatch(row.phone, key.slice(3))) {
    return true;
  }
  return false;
}

/** Soonest pending/confirmed upcoming visit for this patient (API truth). */
export function findOpenReservationForPatient(
  rows: Reservation[],
  opts: { patientKey?: string; phone?: string },
  now = new Date(),
): Reservation | null {
  const open = rows
    .filter((r) => {
      if (r.deleted_at) return false;
      if (r.status !== "pending" && r.status !== "confirmed") return false;
      if (new Date(r.starts_at) < now) return false;
      return reservationMatchesPatient(r, opts);
    })
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  return open[0] ?? null;
}

export function patientActionsFromReservations(
  rows: Reservation[],
  newPatientLabel = "New patient",
): ClinicChatAction[] {
  const groups = groupReservationsByPatient(rows).slice(0, 12);
  return [
    { id: "book:new", label: newPatientLabel },
    ...groups.map((g) => ({
      id: "book:patient",
      label: g.displayName,
      payload: {
        patientKey: g.patientKey,
        name: g.displayName,
        phone: g.phone,
      },
    })),
  ];
}

export function reservationAction(
  prefix: string,
  row: Reservation,
  label?: string,
): ClinicChatAction {
  return {
    id: `${prefix}:${row.id}`,
    label: label ?? `${row.patient_name} · ${formatWhen(row.starts_at)}`,
    payload: {
      id: row.id,
      name: row.patient_name,
      phone: row.phone,
      patientKey: patientKeyFromReservation(row),
      href: `/admin/patients/${encodePatientKey(patientKeyFromReservation(row))}`,
    },
  };
}

export function phoneToPatientKey(phone: string): string {
  const normalized = normalizePhone(phone);
  return normalized ? `phone:${normalized}` : `name:unknown`;
}
