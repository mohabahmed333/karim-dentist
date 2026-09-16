import type { Reservation } from "./types";

export type PatientGroup = {
  patientKey: string;
  displayName: string;
  phone: string;
  email: string | null;
  alternateNames: string[];
  visits: Reservation[];
};

export type PatientTimelineFilter = "all" | "returning" | "new" | "upcoming";

export type PatientHistoryStats = {
  visitCount: number;
  lastVisit: Reservation | null;
  nextVisit: Reservation | null;
  isReturning: boolean;
  hasUpcoming: boolean;
};

export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

/** Digits only, with Egypt local `01…` → `201…` so WA and reservations match. */
export function canonicalPhoneDigits(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Local Egyptian mobile: 01xxxxxxxxx → 201xxxxxxxxx
  if (digits.startsWith("01") && digits.length === 11) {
    digits = `20${digits.slice(1)}`;
  }
  return digits;
}

export function phonesMatch(a: string, b: string): boolean {
  const da = canonicalPhoneDigits(a);
  const db = canonicalPhoneDigits(b);
  if (!da || !db) return false;
  return da === db || da.endsWith(db) || db.endsWith(da);
}

export function patientKeyFromNamePhone(name: string, phone: string): string {
  const digits = canonicalPhoneDigits(phone);
  if (digits) return `phone:${digits}`;
  return `name:${name.trim().toLowerCase()}`;
}

export function patientKeyFromReservation(reservation: Reservation): string {
  const key = patientKeyFromNamePhone(reservation.patient_name, reservation.phone);
  return key === "name:" ? `name:${reservation.id}` : key;
}

/**
 * The patients a doctor is allowed to see: anyone they have a reservation with,
 * plus — by default — anyone whose reservation has no doctor assigned yet.
 *
 * Unassigned counts because public and legacy bookings carry a null
 * `doctor_id`, and excluding them everywhere would hide walk-ins from every
 * doctor at once. `includeUnassigned: false` narrows it to strictly the
 * doctor's own patients, for screens that answer "who is *mine* today" rather
 * than "who may I open".
 *
 * This is a real access boundary, not a convenience filter. Row-level security
 * cannot express it: the `doctor` role has `is_admin_role = true`, so the RBAC
 * trigger writes `profiles.role = 'admin'` and every `USING (is_admin())`
 * policy in the database lets a doctor through. Scoping lives here or nowhere.
 */
export function patientKeysForDoctor(
  reservations: Reservation[],
  doctorId: string,
  options: { includeUnassigned?: boolean } = {},
): Set<string> {
  const { includeUnassigned = true } = options;
  const keys = new Set<string>();
  for (const reservation of reservations) {
    if (reservation.deleted_at !== null) continue;
    if (reservation.doctor_id === null) {
      if (!includeUnassigned) continue;
    } else if (reservation.doctor_id !== doctorId) {
      continue;
    }
    keys.add(patientKeyFromReservation(reservation));
  }
  return keys;
}

export function encodePatientKey(patientKey: string): string {
  return encodeURIComponent(patientKey);
}

export function decodePatientKey(encoded: string): string {
  return decodeURIComponent(encoded);
}

export function groupReservationsByPatient(
  reservations: Reservation[],
): PatientGroup[] {
  const map = new Map<string, PatientGroup>();

  for (const reservation of reservations) {
    if (reservation.deleted_at !== null) continue;
    const patientKey = patientKeyFromReservation(reservation);
    const existing = map.get(patientKey);
    if (!existing) {
      map.set(patientKey, {
        patientKey,
        displayName: reservation.patient_name,
        phone: reservation.phone,
        email: reservation.email,
        alternateNames: [],
        visits: [reservation],
      });
      continue;
    }
    existing.visits.push(reservation);
    if (
      reservation.patient_name !== existing.displayName &&
      !existing.alternateNames.includes(reservation.patient_name)
    ) {
      existing.alternateNames.push(reservation.patient_name);
    }
  }

  const groups = [...map.values()];
  for (const group of groups) {
    group.visits.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    const latest = group.visits[group.visits.length - 1];
    if (latest) group.displayName = latest.patient_name;
  }

  return groups.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/** Adds a zero-visit PatientGroup for any `patients` row not already
 * represented by a reservation (e.g. added directly, never yet booked). */
export function mergePatientsWithoutVisits(
  groups: PatientGroup[],
  patients: {
    patient_key: string;
    display_name: string;
    phone: string;
    email: string | null;
  }[],
): PatientGroup[] {
  const known = new Set(groups.map((g) => g.patientKey));
  const extra: PatientGroup[] = patients
    .filter((p) => !known.has(p.patient_key))
    .map((p) => ({
      patientKey: p.patient_key,
      displayName: p.display_name,
      phone: p.phone,
      email: p.email,
      alternateNames: [],
      visits: [],
    }));
  return [...groups, ...extra].sort((a, b) =>
    a.displayName.localeCompare(b.displayName),
  );
}

export function buildPatientHistoryStats(
  group: PatientGroup,
  now = new Date(),
): PatientHistoryStats {
  const visitCount = group.visits.length;
  const past = group.visits.filter((v) => new Date(v.starts_at) < now);
  const upcoming = group.visits.filter(
    (v) => new Date(v.starts_at) >= now && v.status !== "cancelled",
  );
  return {
    visitCount,
    lastVisit: past[past.length - 1] ?? null,
    nextVisit: upcoming[0] ?? null,
    isReturning: visitCount >= 2,
    hasUpcoming: upcoming.length > 0,
  };
}

export function filterPatientGroups(
  groups: PatientGroup[],
  filter: PatientTimelineFilter,
  search: string,
  now = new Date(),
): PatientGroup[] {
  const query = search.trim().toLowerCase();
  const queryDigits = query.replace(/\D/g, "");
  return groups.filter((group) => {
    const stats = buildPatientHistoryStats(group, now);
    if (filter === "returning" && !stats.isReturning) return false;
    if (filter === "new" && stats.visitCount !== 1) return false;
    if (filter === "upcoming" && !stats.hasUpcoming) return false;
    if (!query) return true;
    const phone = normalizePhone(group.phone).toLowerCase();
    const nameMatch = group.displayName.toLowerCase().includes(query);
    const phoneMatch =
      queryDigits.length > 0
        ? phone.includes(queryDigits) || group.phone.toLowerCase().includes(query)
        : group.phone.toLowerCase().includes(query);
    return nameMatch || phoneMatch;
  });
}

export function getPatientGroup(
  groups: PatientGroup[],
  patientKey: string,
): PatientGroup | null {
  const exact = groups.find((group) => group.patientKey === patientKey);
  if (exact) return exact;
  if (patientKey.startsWith("phone:")) {
    return findPatientGroupByPhone(groups, patientKey.slice("phone:".length));
  }
  return null;
}

export function findPatientGroupByPhone(
  groups: PatientGroup[],
  phone: string,
): PatientGroup | null {
  if (!canonicalPhoneDigits(phone)) return null;
  let best: PatientGroup | null = null;
  for (const group of groups) {
    if (!phonesMatch(group.phone, phone)) continue;
    if (!best || group.visits.length > best.visits.length) best = group;
  }
  return best;
}

export type PatientHistoryDetail = {
  stats: PatientHistoryStats;
  upcomingVisits: Reservation[];
  pastVisits: Reservation[];
  cancelledVisits: Reservation[];
  services: { label: string; count: number }[];
  firstVisit: Reservation | null;
};

export function buildPatientHistoryDetail(
  group: PatientGroup,
  now = new Date(),
): PatientHistoryDetail {
  const stats = buildPatientHistoryStats(group, now);
  const upcomingVisits = group.visits.filter(
    (visit) =>
      new Date(visit.starts_at) >= now && visit.status !== "cancelled",
  );
  const cancelledVisits = group.visits.filter(
    (visit) => visit.status === "cancelled",
  );
  const pastVisits = group.visits.filter(
    (visit) =>
      new Date(visit.starts_at) < now && visit.status !== "cancelled",
  );
  const serviceMap = new Map<string, number>();
  for (const visit of group.visits) {
    serviceMap.set(visit.service_label, (serviceMap.get(visit.service_label) ?? 0) + 1);
  }
  const services = [...serviceMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  return {
    stats,
    upcomingVisits,
    pastVisits: [...pastVisits].reverse(),
    cancelledVisits: [...cancelledVisits].reverse(),
    services,
    firstVisit: group.visits[0] ?? null,
  };
}

export function patientProfilePath(patientKey: string): string {
  return `/admin/patients/${encodePatientKey(patientKey)}`;
}

export function patientWorkspacePath(patientKey: string): string {
  return `/admin/patients/${encodePatientKey(patientKey)}/workspace`;
}

export function formatPatientVisitDate(startsAt: string): string {
  return new Date(startsAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
