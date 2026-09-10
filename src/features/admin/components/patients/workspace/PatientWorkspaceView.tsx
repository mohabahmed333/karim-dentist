"use client";

import { useState } from "react";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { PatientImaging } from "@/services/patient_imaging";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import type { PatientTreatmentRow } from "@/services/patient_treatments";
import type { Service } from "@/services/services/types";
import { toothName } from "@/services/patient_tooth_findings/fdi";
import type { TreatmentAiDraft } from "@/services/ai_groq";
import type { ProposalReviewState } from "@/features/admin/components/chat/ActionReviewCard";
import { PATIENT_SHELL } from "../patientSkin";
import { WorkspaceChartPane } from "./WorkspaceChartPane";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceOverlays } from "./WorkspaceOverlays";
import { WorkspaceRightPane } from "./WorkspaceRightPane";
import { usePatientWorkspace } from "./usePatientWorkspace";
import {
  findExistingTreatmentForDraft,
  wizardDraftFromAi,
  wizardDraftFromTreatment,
  type WizardLaunch,
} from "./wizardModel";

type Props = {
  group: PatientGroup;
  notes: PatientToothNote[];
  imaging: PatientImaging[];
  treatments: PatientTreatmentRow[];
  services: Service[];
  directory: PatientGroup[];
  /** Fit inside a drawer instead of full admin page chrome. */
  embedded?: boolean;
  /** Showreel: force selected tooth (skips URL). */
  forcedToothFdi?: string | null;
  /** Showreel: seed ActionReviewCard without calling propose API. */
  demoReview?: ProposalReviewState | null;
  /** Showreel: ActionReviewCard skips confirm API. */
  localOnly?: boolean;
};

export function PatientWorkspaceView(props: Props) {
  const {
    group,
    services,
    embedded = false,
    forcedToothFdi = null,
    demoReview = null,
    localOnly = false,
  } = props;
  const [wizardLaunch, setWizardLaunch] = useState<WizardLaunch | null>(null);
  const w = usePatientWorkspace(
    group,
    props.notes,
    props.imaging,
    props.treatments,
    forcedToothFdi,
  );

  function applyAiDraft(
    draft: TreatmentAiDraft,
    existingTreatmentId?: string | null,
  ) {
    if (!w.selectedFdi) return;
    const existing = findExistingTreatmentForDraft(
      w.treatmentsChart.items,
      w.selectedFdi,
      draft.cdt_code,
      existingTreatmentId,
    );
    if (existing) {
      setWizardLaunch({
        treatmentId: existing.id,
        draft: wizardDraftFromTreatment(existing),
      });
      return;
    }
    setWizardLaunch({
      treatmentId: "new",
      draft: wizardDraftFromAi(
        w.selectedFdi,
        toothName(w.selectedFdi),
        draft,
      ),
    });
  }

  return (
    <div
      className={
        embedded
          ? `relative flex h-full min-h-0 flex-col ${PATIENT_SHELL}`
          : `relative -m-4 flex h-[calc(100dvh-4.5rem)] min-h-0 flex-col ${PATIENT_SHELL} md:-m-6`
      }
    >
      <WorkspaceHeader group={group} />
      <div className="relative grid min-h-0 flex-1 items-stretch lg:grid-cols-2">
        <div
          data-showreel-action="clinical-chart"
          className="flex min-h-0 flex-col px-4 py-4 md:px-6 md:py-5 lg:pe-4"
        >
          <WorkspaceChartPane
            notation={w.session.notation}
            dentition={w.session.dentition}
            paintTool={w.session.paintTool}
            chartStyle={w.chartStyle}
            selectedFdi={w.selectedFdi}
            byFdi={w.surfaces.byFdi}
            commented={w.notesChart.commented}
            onSelect={(fdi) => w.selectTooth(fdi)}
            onDeselect={() => w.deselectTooth()}
            onPaint={(fdi, surface) => {
              w.selectTooth(fdi);
              void w.surfaces.paint(fdi, surface, w.session.paintTool);
            }}
          />
        </div>
        <div className="flex min-h-0 flex-col border-t border-[#e5e7eb] lg:border-t-0">
          <WorkspaceRightPane
            group={group}
            selectedFdi={w.selectedFdi}
            chart={w.treatmentsChart}
            imaging={w.imagingChart.items}
            toothNotes={w.notesChart.notes}
            clinicalNotes={w.clinicalNotes.notes}
            services={services}
            wizardLaunch={wizardLaunch}
            onWizardLaunchApplied={() => setWizardLaunch(null)}
            onApplyAiDraft={applyAiDraft}
            demoReview={demoReview}
            localOnly={localOnly}
          />
        </div>
      </div>
      <WorkspaceOverlays group={group} services={services} w={w} />
    </div>
  );
}
