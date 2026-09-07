"use client";

import { useMemo, useState } from "react";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import {
  assembleDentalChart,
  buildPatientProfile,
  cycleStream,
  deriveChartView,
  ZOOM_SCALES,
  type TimelineRange,
} from "@/services/dental_chart";
import type { DashboardTab } from "./dashboard.types";
import { useBentoPanel } from "./useBentoPanel";
import { useDashboardInteractions } from "./useDashboardInteractions";

export function useDentalChartSession(group: PatientGroup) {
  const chart = useMemo(
    () =>
      assembleDentalChart(
        buildPatientProfile(group.patientKey, group.displayName),
        group.visits,
      ),
    [group],
  );
  const [tab, setTab] = useState<DashboardTab>("history");
  const [selectedToothId, setSelectedToothId] = useState<number | null>(null);
  const [selectedConditionId, setSelectedConditionId] = useState("cond-endo");
  const [timelineRange, setTimelineRange] = useState<TimelineRange>({
    startYear: 2015,
    endYear: 2016,
  });
  const [zoomIndex, setZoomIndex] = useState(0);

  const view = useMemo(
    () =>
      deriveChartView(
        chart,
        selectedToothId,
        selectedConditionId,
        timelineRange,
        zoomIndex,
      ),
    [chart, selectedToothId, selectedConditionId, timelineRange, zoomIndex],
  );

  const interactions = useDashboardInteractions({
    stream: view.stream,
    setSelectedConditionId,
    setSelectedToothId,
  });

  const bento = useBentoPanel({
    timelineRange,
    encounters: view.encounters,
    prescriptions: chart.prescriptions,
    labs: view.labs,
    setTimelineRange,
    setSelectedConditionId,
    setExpandedConditionId: interactions.setExpandedConditionId,
  });

  function onCycleCondition(dir: -1 | 1) {
    const next = cycleStream(view.stream, selectedConditionId, dir);
    setSelectedConditionId(next);
    interactions.setExpandedConditionId(next);
  }

  return {
    chart,
    tab,
    setTab,
    selectedToothId,
    selectedConditionId,
    timelineRange,
    setTimelineRange,
    zoomIndex,
    setZoomIndex: (next: number) =>
      setZoomIndex(Math.max(0, Math.min(next, ZOOM_SCALES.length - 1))),
    ...view,
    ...interactions,
    ...bento,
    onSelectTooth: interactions.onFocusTooth,
    onSelectCondition: interactions.onSelectCondition,
    onCycleCondition,
  };
}
