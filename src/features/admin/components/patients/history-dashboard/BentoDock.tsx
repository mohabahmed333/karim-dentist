"use client";

import { LabsRail } from "./LabsRail";
import { MedicationsRail } from "./MedicationsRail";
import { VisitsRail } from "./VisitsRail";
import type { useBentoPanel } from "./useBentoPanel";

type Props = ReturnType<typeof useBentoPanel>;

export function BentoDock(props: Props) {
  return (
    <div className="grid gap-4 pt-3 lg:grid-cols-3">
      <MedicationsRail
        prescriptions={props.visibleRx}
        granularity={props.rxGranularity}
        selectedRxId={props.selectedRxId}
        drawerOpen={props.rxDrawerOpen}
        onGranularity={props.setRxGranularity}
        onSelect={props.selectRx}
        onDrawerOpen={props.setRxDrawerOpen}
      />
      <VisitsRail
        encounters={props.visibleVisits}
        activeId={props.activeEncounterId}
        scrollRef={props.visitsScrollRef}
        visitCategories={props.visitCategories}
        onVisitCategories={props.setVisitCategories}
        onSelect={props.selectVisit}
      />
      <LabsRail labs={props.visibleLabs} filter={props.labFilter} onFilter={props.setLabFilter} />
    </div>
  );
}
