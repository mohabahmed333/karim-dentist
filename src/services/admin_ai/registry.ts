import type { ActionAdapter } from "./adapterTypes";
import {
  cmsUpdateSingletonAdapter,
  cmsUpsertItemAdapter,
} from "./cmsAdapters";
import {
  cmsArchiveAdapter,
  cmsReorderAdapter,
  cmsSetMediaAdapter,
} from "./cmsMediaAdapters";
import {
  chartSetSurfacesAdapter,
  chartUpsertFindingAdapter,
  imagingAttachAdapter,
  labCreateAdapter,
  labUpdateStatusAdapter,
  noteClinicalAdapter,
  noteGeneralAdapter,
  rxCreateAdapter,
  treatmentCompleteAdapter,
  treatmentCreateAdapter,
  treatmentUpdateAdapter,
} from "./clinicalAdapters";
import {
  followupBookAdapter,
  navigateFocusToothAdapter,
  navigateOpenPatientAdapter,
} from "./navFollowupAdapters";
import { reservationAdapters } from "./reservationAdapters";
import type { ActionKind } from "./schemas";
import { isWriteActionKind } from "./writeKinds";

const adapters: ActionAdapter[] = [
  navigateOpenPatientAdapter,
  navigateFocusToothAdapter,
  cmsUpdateSingletonAdapter,
  cmsUpsertItemAdapter,
  cmsReorderAdapter,
  cmsArchiveAdapter,
  cmsSetMediaAdapter,
  noteGeneralAdapter,
  noteClinicalAdapter,
  chartSetSurfacesAdapter,
  chartUpsertFindingAdapter,
  treatmentCreateAdapter,
  treatmentUpdateAdapter,
  treatmentCompleteAdapter,
  imagingAttachAdapter,
  rxCreateAdapter,
  labCreateAdapter,
  labUpdateStatusAdapter,
  followupBookAdapter,
  ...reservationAdapters,
];

const byKind = new Map(adapters.map((a) => [a.kind, a]));

export function getAdapter(kind: ActionKind): ActionAdapter {
  const adapter = byKind.get(kind);
  if (!adapter) throw new Error(`No adapter for ${kind}`);
  return adapter;
}

export function listActionKinds(): ActionKind[] {
  return adapters.map((a) => a.kind);
}

export function isWriteAction(kind: ActionKind): boolean {
  return isWriteActionKind(kind);
}
