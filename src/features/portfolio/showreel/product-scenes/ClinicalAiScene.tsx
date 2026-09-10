"use client";

import { useEffect, useMemo } from "react";
import type { ProposalReviewState } from "@/features/admin/components/chat/ActionReviewCard";
import { clearChatHistory } from "@/features/admin/components/patients/workspace/chatHistoryStorage";
import { PatientWorkspaceView } from "@/features/admin/components/patients/workspace/PatientWorkspaceView";
import {
  buildShowreelClinicalGroup,
  buildShowreelClinicalImaging,
  buildShowreelClinicalNotes,
  buildShowreelClinicalServices,
  buildShowreelClinicalTreatments,
} from "./buildShowreelClinicalWorkspace";
import { CLINICAL_AI_FIXTURE } from "./fixtures/patientClinicalFixtures";
import { ShowreelAdminSceneFrame } from "./ShowreelAdminSceneFrame";
import { SHOWREEL_CLINICAL_CURSOR_STEPS } from "./showreelCursorTimeline";
import { useShowreelPhase } from "./useShowreelPhase";

type Props = { active: boolean };

type Phase = "idle" | "selected" | "summary" | "reviewed";

const PHASES: { id: Phase; at: number }[] = [
  { id: "selected", at: 1800 },
  { id: "summary", at: 10000 },
  { id: "reviewed", at: 14500 },
];

function buildReview(): ProposalReviewState {
  const fx = CLINICAL_AI_FIXTURE;
  return {
    proposalId: "showreel-clinical",
    summary: fx.caseSummary.findings.join(" · "),
    diffs: [
      {
        actionId: "tx-16",
        kind: "treatment.create",
        target: `#${fx.toothFdi} · ${fx.toothName}`,
        before: {},
        after: { title: fx.caseSummary.proposedTreatment.title },
        warnings: [],
      },
    ],
    actions: [],
  };
}

/** Real patient workspace: note + imaging upload + AI review confirm. */
export function ClinicalAiScene({ active }: Props) {
  const phase = useShowreelPhase(active, "idle", PHASES);
  const group = useMemo(() => buildShowreelClinicalGroup(), []);
  const imaging = useMemo(() => buildShowreelClinicalImaging(), []);
  const notes = useMemo(() => buildShowreelClinicalNotes(), []);
  const treatments = useMemo(() => buildShowreelClinicalTreatments(), []);
  const services = useMemo(() => buildShowreelClinicalServices(), []);
  const review = useMemo(() => buildReview(), []);

  useEffect(() => {
    if (!active) return;
    clearChatHistory(group.patientKey, CLINICAL_AI_FIXTURE.toothFdi);
  }, [active, group.patientKey]);

  const forcedToothFdi =
    phase === "idle" ? null : CLINICAL_AI_FIXTURE.toothFdi;
  const demoReview =
    phase === "summary" || phase === "reviewed" ? review : null;

  return (
    <ShowreelAdminSceneFrame
      active={active}
      cursorSteps={SHOWREEL_CLINICAL_CURSOR_STEPS}
      className="showreel-demo-clinical"
      hideFloatingBubbles
    >
      <PatientWorkspaceView
        key={active ? "clinical-live" : "clinical-idle"}
        group={group}
        notes={notes}
        imaging={imaging}
        treatments={treatments}
        services={services}
        directory={[group]}
        embedded
        forcedToothFdi={forcedToothFdi}
        demoReview={demoReview}
        localOnly
      />
    </ShowreelAdminSceneFrame>
  );
}
