import type { TeethChartStyle } from "../teeth-charts/chartStyles";
import { TEETH_CHART_STYLES } from "../teeth-charts/chartStyles";

export type ChartingChartStyle = "surfaces" | TeethChartStyle;

export const CHARTING_CHART_STYLES: {
  id: ChartingChartStyle;
  label: string;
  hint: string;
}[] = [
  {
    id: "surfaces",
    label: "Surfaces",
    hint: "5-surface paint chart",
  },
  ...TEETH_CHART_STYLES,
];

export function isChartingChartStyle(value: string): value is ChartingChartStyle {
  return CHARTING_CHART_STYLES.some((row) => row.id === value);
}
