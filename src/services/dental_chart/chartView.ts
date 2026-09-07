import {
  clusterTimelineTicks,
  filterEncounters,
  filterLabs,
  filterPrescriptions,
} from "./timeline";
import { buildNodeGraph, filterConditionStream } from "./graph";
import { TIMELINE_YEARS } from "./labels";
import { zoomScaleAt } from "./scrubber-math";
import type { DentalChart, TimelineRange } from "./types";

export function deriveChartView(
  chart: DentalChart,
  toothId: number | null,
  conditionId: string,
  range: TimelineRange,
  zoomIndex: number,
) {
  const stream = filterConditionStream(chart.conditions, toothId);
  const encounters = filterEncounters(chart.encounters, range);
  const zoomScale = zoomScaleAt(zoomIndex);
  return {
    stream,
    graph: buildNodeGraph(chart, conditionId),
    encounters,
    prescriptions: filterPrescriptions(chart.prescriptions, range),
    labs: filterLabs(chart.labs, range),
    ticks: clusterTimelineTicks(
      encounters.map((item) => item.timestamp),
      TIMELINE_YEARS,
      zoomScale,
    ),
    zoomScale,
  };
}
