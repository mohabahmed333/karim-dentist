"use client";

import { EHR } from "./ehr.types";
import { EhrArchStage } from "./EhrArchStage";
import { EhrDetailPane } from "./EhrDetailPane";
import { EhrLedger } from "./EhrLedger";
import { EhrNodeStage } from "./EhrNodeStage";
import { EhrVisitPanel } from "./EhrVisitPanel";
import { useEhrSession } from "./useEhrSession";
import type { PatientImaging } from "@/services/patient_imaging";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import type { TreatmentItem } from "@/services/patient_treatments";
import type { PatientGroup } from "@/services/reservations/patientHistory";

type Props = {
  group: PatientGroup;
  treatments: TreatmentItem[];
  imaging: PatientImaging[];
  notes: PatientToothNote[];
  /** Drawer: arch on top half, ledger + detail below. */
  layout?: "default" | "stacked";
};

export function PatientEhrView(props: Props) {
  const s = useEhrSession(props);
  const stacked = props.layout === "stacked";

  const detail = (
    <section className="min-h-0 min-w-0 overflow-y-auto">
      {s.activeCondition && s.activeTreatment ? (
        <EhrDetailPane
          treatment={s.activeTreatment}
          expanded={s.expandedTx}
          onToggle={() => s.setExpandedTx((v) => !v)}
          propNodes={s.propNodes}
          media={s.linkedMedia}
        />
      ) : (
        <div
          className="rounded-2xl border px-4 py-6 text-[12px]"
          style={{
            background: EHR.card,
            borderColor: EHR.border,
            color: EHR.muted,
          }}
        >
          Select a required treatment to expand details.
        </div>
      )}
    </section>
  );

  const ledger = (
    <div className="min-h-0 min-w-0 overflow-y-auto">
      <EhrLedger
        conditions={s.model.conditions}
        treatments={props.treatments}
        activeId={s.activeCondition?.id ?? null}
        notes={s.sceneNotes}
        emptyNotes={
          s.activeFdi
            ? `No notes for tooth #${s.activeFdi}`
            : "Select a tooth to see notes"
        }
        onSelect={(c) => s.selectCondition(c.id, c.toothUniversal)}
      />
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <EhrNodeStage
        footer={
          <EhrVisitPanel
            group={props.group}
            visits={s.model.visits}
            onSelect={s.setVisitId}
          />
        }
      >
        {stacked ? (
          <div className="flex h-full min-h-0 flex-col gap-3 p-3 sm:p-4">
            <section className="min-h-0 flex-[1.1] overflow-hidden">
              <EhrArchStage
                conditions={s.model.conditions}
                active={s.activeCondition}
                selectedToothId={s.selectedToothId}
                flipped={s.archFlip}
                onFlip={() => s.setArchFlip((v) => !v)}
                onSelectTooth={s.selectTooth}
                fill
              />
            </section>
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
              {detail}
              {ledger}
            </div>
          </div>
        ) : (
          <div className="grid h-full grid-cols-1 items-start gap-8 overflow-auto p-4 sm:p-5 @[880px]:grid-cols-[minmax(320px,0.95fr)_minmax(260px,340px)_minmax(0,1.2fr)] @[880px]:gap-8 lg:p-6">
            <section className="w-full lg:sticky lg:top-2">
              <EhrArchStage
                conditions={s.model.conditions}
                active={s.activeCondition}
                selectedToothId={s.selectedToothId}
                flipped={s.archFlip}
                onFlip={() => s.setArchFlip((v) => !v)}
                onSelectTooth={s.selectTooth}
              />
            </section>
            {ledger}
            {detail}
          </div>
        )}
      </EhrNodeStage>
    </div>
  );
}
