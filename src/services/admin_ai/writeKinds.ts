import type { ActionKind } from "./schemas";

/** Kinds that mutate data and require Confirm. Safe for client imports. */
export const WRITE_ACTION_KINDS = new Set<ActionKind>([
  "cms.update_singleton",
  "cms.upsert_item",
  "cms.reorder",
  "cms.archive",
  "cms.set_media",
  "note.general",
  "note.clinical",
  "chart.set_surfaces",
  "chart.upsert_finding",
  "treatment.create",
  "treatment.update",
  "treatment.complete",
  "imaging.attach",
  "rx.create",
  "lab.create",
  "lab.update_status",
  "followup.book",
]);

export function isWriteActionKind(kind: string): boolean {
  return WRITE_ACTION_KINDS.has(kind as ActionKind);
}
