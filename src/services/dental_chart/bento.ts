import type { Encounter, LabOrder, Prescription, TimelineRange } from "./types";
import type { EncounterType } from "./enums";
import { filterPrescriptions } from "./timeline";

export type RxGranularity = "DAYS" | "WEEKS" | "MONTHS" | "ALL_TIME";
export type VisitCategory =
  | "HYGIENE"
  | "ENDODONTIC"
  | "SURGICAL"
  | "ORTHODONTIC"
  | "EMERGENCY";
export type LabViewFilter = "IN_PROGRESS" | "COMPLETED" | "DIAGNOSTICS";

export const RX_GRANULARITY_LABELS: Record<RxGranularity, string> = {
  DAYS: "Days",
  WEEKS: "Weeks",
  MONTHS: "Months",
  ALL_TIME: "All-Time",
};

export const VISIT_CATEGORIES: VisitCategory[] = [
  "HYGIENE",
  "ENDODONTIC",
  "SURGICAL",
  "ORTHODONTIC",
  "EMERGENCY",
];

export const LAB_VIEW_LABELS: Record<LabViewFilter, string> = {
  IN_PROGRESS: "In-Progress Lab Orders",
  COMPLETED: "Completed Appliances",
  DIAGNOSTICS: "Diagnostic Blood/Culture Tests",
};

const RX_CONDITION: Record<string, string> = {
  "rx-amox": "cond-endo",
  "rx-ibu": "cond-endo",
  "rx-chx": "cond-recession",
};

export function linkedConditionForRx(rxId: string): string | null {
  return RX_CONDITION[rxId] ?? null;
}

export function encounterCategory(type: EncounterType): VisitCategory {
  if (type === "PULPECTOMY") return "ENDODONTIC";
  if (type === "PERIO_PROBING") return "HYGIENE";
  if (type === "CROWN_PREP") return "SURGICAL";
  if (type === "CBCT_SCAN") return "EMERGENCY";
  return "HYGIENE";
}

export function filterPrescriptionsByGranularity(
  items: Prescription[],
  range: TimelineRange,
  granularity: RxGranularity,
): Prescription[] {
  if (granularity === "ALL_TIME") return items;
  const scoped = filterPrescriptions(items, range);
  if (granularity === "MONTHS") return scoped;
  const now = new Date(`${range.endYear}-10-21`);
  const windowDays = granularity === "DAYS" ? 7 : 28;
  return scoped.filter((rx) => {
    const end = new Date(rx.endDate);
    const diff = Math.abs(now.getTime() - end.getTime()) / 86_400_000;
    return diff <= windowDays;
  });
}

export function filterEncountersByCategory(
  items: Encounter[],
  categories: VisitCategory[],
): Encounter[] {
  const allowed = new Set(categories);
  return items.filter((item) => allowed.has(encounterCategory(item.type)));
}

export function filterLabsByView(items: LabOrder[], view: LabViewFilter): LabOrder[] {
  if (view === "COMPLETED") return items.filter((item) => item.status === "DELIVERED");
  if (view === "DIAGNOSTICS") return [];
  return items.filter((item) => item.status !== "DELIVERED");
}

export function rangeForVisit(iso: string): TimelineRange {
  const year = new Date(iso).getFullYear();
  return { startYear: year, endYear: year };
}

export function labPipelineStage(percent: number): number {
  if (percent >= 100) return 4;
  if (percent >= 95) return 4;
  if (percent >= 83) return 3;
  if (percent >= 40) return 2;
  if (percent >= 15) return 1;
  return 0;
}

export const LAB_PIPELINE = [
  { label: "Digital Impression Received", dot: "size-4 bg-[#E2F163]" },
  { label: "3D CAD Design Completed", dot: "size-3.5 bg-[#d6cfc3]" },
  { label: "Milling / Printing in Progress", dot: "size-3 bg-[#b0b0b0]" },
  { label: "Sintering & Glazing", dot: "size-2 bg-[#7a7a7a]" },
  { label: "Shipped / Ready for Placement", dot: "size-1.5 bg-[#111111]" },
] as const;
