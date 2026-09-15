import type { AdminMessageKey } from "@/lib/i18n";
import type { TeethChartStyle } from "../teeth-charts/chartStyles";
import { TEETH_CHART_STYLES } from "../teeth-charts/chartStyles";

export type ChartingChartStyle = "surfaces" | TeethChartStyle;

export const CHARTING_CHART_STYLES: {
  id: ChartingChartStyle;
  labelKey: AdminMessageKey;
  hintKey: AdminMessageKey;
}[] = [
  {
    id: "surfaces",
    labelKey: "admin.chartStyle.surfaces",
    hintKey: "admin.chartStyle.surfacesHint",
  },
  ...TEETH_CHART_STYLES,
];

export function isChartingChartStyle(value: string): value is ChartingChartStyle {
  return CHARTING_CHART_STYLES.some((row) => row.id === value);
}
