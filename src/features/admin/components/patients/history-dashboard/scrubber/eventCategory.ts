import type { EncounterType } from "@/services/dental_chart/enums";
import type { TimelineEventCategory } from "./scrubber.types";

export const EVENT_CATEGORY_COLORS: Record<TimelineEventCategory, string> = {
  SURGERY: "#111111",
  XRAY: "#2563eb",
  LAB: "#7c3aed",
  NOTE: "#525252",
};

export function categoryFromEncounter(type: EncounterType): TimelineEventCategory {
  if (type === "CBCT_SCAN") return "XRAY";
  if (type === "PULPECTOMY" || type === "CROWN_PREP") return "SURGERY";
  return "NOTE";
}
