/**
 * Every table the system_action_log trigger is attached to, and which of
 * those support one-click revert. Kept as two lists (not one) because a
 * table can be tracked without being safe to revert — see
 * docs/superpowers/specs/2026-09-14-system-action-log-design.md.
 */
export const TRACKED_TABLES = [
  "reservations",
  "appointment_slots",
  "clinic_hours",
  "doctor_hours",
  "clinic_cdt_fees",
  "clinic_treatment_presets",
  "patient_profiles",
  "patient_clinical_notes",
  "patient_treatments",
  "patient_imaging",
  "patient_tooth_notes",
  "patient_tooth_note_attachments",
  "patient_tooth_surfaces",
  "profiles",
  "roles",
  "permissions",
  "role_permissions",
  "whatsapp_conversations",
  "clinic_chat_threads",
] as const;

export type TrackedTable = (typeof TRACKED_TABLES)[number];

/** Tracked, but excluded from revert: composite key or no external system to stay in sync with. */
const NOT_REVERTIBLE = new Set<TrackedTable>([
  "role_permissions",
  "whatsapp_conversations",
  "clinic_chat_threads",
]);

export function isRevertible(table: string): boolean {
  return (
    (TRACKED_TABLES as readonly string[]).includes(table) &&
    !NOT_REVERTIBLE.has(table as TrackedTable)
  );
}
