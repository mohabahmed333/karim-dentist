import type { AdminMessageKey } from "@/lib/i18n";

export type TeethChartStyle =
  | "anatomic"
  | "arch"
  | "grid"
  | "circles"
  | "model";

export const TEETH_CHART_STYLES: {
  id: TeethChartStyle;
  labelKey: AdminMessageKey;
  hintKey: AdminMessageKey;
}[] = [
  {
    id: "anatomic",
    labelKey: "admin.chartStyle.anatomic",
    hintKey: "admin.chartStyle.anatomicHint",
  },
  {
    id: "arch",
    labelKey: "admin.chartStyle.arch",
    hintKey: "admin.chartStyle.archHint",
  },
  {
    id: "grid",
    labelKey: "admin.chartStyle.grid",
    hintKey: "admin.chartStyle.gridHint",
  },
  {
    id: "circles",
    labelKey: "admin.chartStyle.circles",
    hintKey: "admin.chartStyle.circlesHint",
  },
  {
    id: "model",
    labelKey: "admin.chartStyle.model",
    hintKey: "admin.chartStyle.modelHint",
  },
];
