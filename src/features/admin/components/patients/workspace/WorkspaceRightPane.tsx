"use client";

import type { ClinicalNote } from "@/services/clinical_notes";
import type { PatientImaging } from "@/services/patient_imaging";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { Service } from "@/services/services/types";
import type { TreatmentAiDraft } from "@/services/ai_groq";
import type { ProposalReviewState } from "@/features/admin/components/chat/ActionReviewCard";
import type { usePatientTreatments } from "../usePatientTreatments";
import { WorkspaceTreatmentsPane } from "./WorkspaceTreatmentsPane";
import type { WizardLaunch } from "./wizardModel";
import type { PriceableDoctor } from "@/services/service_doctors/pricing";
import type { ServiceDoctorMapping } from "@/services/service_doctors/queries";

type Props = {
  group: PatientGroup;
  selectedFdi: string | null;
  chart: ReturnType<typeof usePatientTreatments>;
  imaging: PatientImaging[];
  toothNotes: PatientToothNote[];
  clinicalNotes: ClinicalNote[];
  services: Service[];
  wizardLaunch: WizardLaunch | null;
  onWizardLaunchApplied: () => void;
  onApplyAiDraft: (
    draft: TreatmentAiDraft,
    existingTreatmentId?: string | null,
  ) => void;
  demoReview?: ProposalReviewState | null;
  localOnly?: boolean;
  doctors: PriceableDoctor[];
  serviceDoctorMappings: Record<string, ServiceDoctorMapping[]>;
  canPropose: boolean;
};

export function WorkspaceRightPane(props: Props) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <WorkspaceTreatmentsPane
        group={props.group}
        selectedFdi={props.selectedFdi}
        chart={props.chart}
        imaging={props.imaging}
        toothNotes={props.toothNotes}
        clinicalNotes={props.clinicalNotes}
        services={props.services}
        wizardLaunch={props.wizardLaunch}
        onWizardLaunchApplied={props.onWizardLaunchApplied}
        onApplyAiDraft={props.onApplyAiDraft}
        demoReview={props.demoReview}
        localOnly={props.localOnly}
        doctors={props.doctors}
        serviceDoctorMappings={props.serviceDoctorMappings}
        canPropose={props.canPropose}
      />
    </div>
  );
}
