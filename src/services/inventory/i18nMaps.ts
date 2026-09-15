import type { AdminMessageKey } from "@/lib/i18n";
import type { InventoryItemCategory, InventoryItemUnit, WastageReasonCode } from "./types";

export const CATEGORY_LABEL_KEYS: Record<InventoryItemCategory, AdminMessageKey> = {
  implant: "admin.pages.inventory.category.implant",
  anesthesia: "admin.pages.inventory.category.anesthesia",
  injectable: "admin.pages.inventory.category.injectable",
  suture: "admin.pages.inventory.category.suture",
  bone_graft: "admin.pages.inventory.category.bone_graft",
  disposable: "admin.pages.inventory.category.disposable",
  ppe: "admin.pages.inventory.category.ppe",
  instrument: "admin.pages.inventory.category.instrument",
  general: "admin.pages.inventory.category.general",
};

export const UNIT_LABEL_KEYS: Record<InventoryItemUnit, AdminMessageKey> = {
  unit: "admin.pages.inventory.unit.unit",
  vial: "admin.pages.inventory.unit.vial",
  ampoule: "admin.pages.inventory.unit.ampoule",
  box: "admin.pages.inventory.unit.box",
  ml: "admin.pages.inventory.unit.ml",
  mg: "admin.pages.inventory.unit.mg",
  syringe: "admin.pages.inventory.unit.syringe",
};

export const REASON_LABEL_KEYS: Record<WastageReasonCode, AdminMessageKey> = {
  dropped_contaminated: "admin.pages.inventory.reason.dropped_contaminated",
  expired: "admin.pages.inventory.reason.expired",
  damaged_packaging: "admin.pages.inventory.reason.damaged_packaging",
  patient_no_show_opened: "admin.pages.inventory.reason.patient_no_show_opened",
  equipment_failure: "admin.pages.inventory.reason.equipment_failure",
  recount_correction: "admin.pages.inventory.reason.recount_correction",
  received_shipment: "admin.pages.inventory.reason.received_shipment",
  returned_to_supplier: "admin.pages.inventory.reason.returned_to_supplier",
  other: "admin.pages.inventory.reason.other",
};

/** Arabic name when viewing in Arabic and one is on file, English otherwise —
 * mirrors how `services.title_ar` is used elsewhere in the admin panel. */
export function localizedItemName(
  locale: "en" | "ar",
  name: string,
  nameAr: string | null | undefined,
): string {
  return locale === "ar" && nameAr?.trim() ? nameAr : name;
}
