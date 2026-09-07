"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Encounter, LabOrder, Prescription, TimelineRange } from "@/services/dental_chart";
import {
  filterEncountersByCategory,
  filterLabsByView,
  filterPrescriptionsByGranularity,
  linkedConditionForRx,
  rangeForVisit,
  type LabViewFilter,
  type RxGranularity,
  type VisitCategory,
  VISIT_CATEGORIES,
} from "@/services/dental_chart/bento";

type Args = {
  timelineRange: TimelineRange;
  encounters: Encounter[];
  prescriptions: Prescription[];
  labs: LabOrder[];
  setTimelineRange: (range: TimelineRange) => void;
  setSelectedConditionId: (id: string) => void;
  setExpandedConditionId: (id: string | null) => void;
};

export function useBentoPanel({
  timelineRange,
  encounters,
  prescriptions,
  labs,
  setTimelineRange,
  setSelectedConditionId,
  setExpandedConditionId,
}: Args) {
  const [rxGranularity, setRxGranularity] = useState<RxGranularity>("WEEKS");
  const [selectedRxId, setSelectedRxId] = useState<string | null>(null);
  const [rxDrawerOpen, setRxDrawerOpen] = useState(false);
  const [visitCategories, setVisitCategories] = useState<VisitCategory[]>(VISIT_CATEGORIES);
  const [labFilter, setLabFilter] = useState<LabViewFilter>("IN_PROGRESS");
  const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null);
  const visitsScrollRef = useRef<HTMLDivElement>(null);

  const visibleRx = useMemo(
    () => filterPrescriptionsByGranularity(prescriptions, timelineRange, rxGranularity),
    [prescriptions, timelineRange, rxGranularity],
  );

  const visibleVisits = useMemo(
    () => filterEncountersByCategory(encounters, visitCategories),
    [encounters, visitCategories],
  );

  const visibleLabs = useMemo(
    () => filterLabsByView(labs, labFilter),
    [labs, labFilter],
  );

  useEffect(() => {
    if (visibleVisits.length === 0) return;
    if (!activeEncounterId || !visibleVisits.some((item) => item.id === activeEncounterId)) {
      setActiveEncounterId(
        visibleVisits.find((item) => item.type === "CBCT_SCAN")?.id ??
          visibleVisits[0]?.id ??
          null,
      );
    }
  }, [visibleVisits, activeEncounterId]);

  const selectVisit = useCallback(
    (encounter: Encounter) => {
      setActiveEncounterId(encounter.id);
      setTimelineRange(rangeForVisit(encounter.timestamp));
      const conditionId = encounter.conditionIds[0];
      if (conditionId) {
        setSelectedConditionId(conditionId);
        setExpandedConditionId(conditionId);
      }
      requestAnimationFrame(() => {
        visitsScrollRef.current
          ?.querySelector(`[data-visit-id="${encounter.id}"]`)
          ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      });
    },
    [setExpandedConditionId, setSelectedConditionId, setTimelineRange],
  );

  const selectRx = useCallback(
    (rxId: string) => {
      setSelectedRxId(rxId);
      const conditionId = linkedConditionForRx(rxId);
      if (conditionId) {
        setSelectedConditionId(conditionId);
        setExpandedConditionId(conditionId);
      }
    },
    [setExpandedConditionId, setSelectedConditionId],
  );

  return {
    rxGranularity,
    setRxGranularity,
    selectedRxId,
    selectRx,
    rxDrawerOpen,
    setRxDrawerOpen,
    visitCategories,
    setVisitCategories,
    labFilter,
    setLabFilter,
    activeEncounterId,
    selectVisit,
    visitsScrollRef,
    visibleRx,
    visibleVisits,
    visibleLabs,
  };
}
