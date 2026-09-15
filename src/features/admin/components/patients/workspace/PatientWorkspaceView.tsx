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
import type { PriceableDoctor } from "@/services/service_doctors/pricing";
import type { ServiceDoctorMapping } from "@/services/service_doctors/queries";
import { AddChargeForm } from "../billing/AddChargeForm";
import { BillPatientDialog } from "@/features/admin/components/billing/BillPatientDialog";
import { formatEgp } from "@/services/deposits/receiptMessages";
import { useLocale } from "@/lib/i18n";

type Props = {
  group: PatientGroup;
  notes: PatientToothNote[];
  imaging: PatientImaging[];
  treatments: PatientTreatmentRow[];
  services: Service[];
  directory: PatientGroup[];
  /** Fit inside a drawer instead of full admin page chrome. */
  embedded?: boolean;
  /**
   * False when the host already shows the patient's name and bill action, as
   * My Day does — two identical headers stacked reads as a rendering bug.
   */
  showHeader?: boolean;
  /** Showreel: force selected tooth (skips URL). */
  forcedToothFdi?: string | null;
  /** Showreel: seed ActionReviewCard without calling propose API. */
  demoReview?: ProposalReviewState | null;
  /** Showreel: ActionReviewCard skips confirm API. */
  localOnly?: boolean;
  /** For the AI tooth draft's "Propose to patient" action, and the manual billing card. */
  doctors: PriceableDoctor[];
  serviceDoctorMappings: Record<string, ServiceDoctorMapping[]>;
  canPropose: boolean;
  /** `reservations.create` + `reservations.edit`. Doctors have neither. */
  canBook?: boolean;
  /** `patients.edit`. Gates the client profile drawer. */
  canEditProfile?: boolean;
  canEditBilling: boolean;
  billingBalance: number;
  /** The signed-in doctor, so billing doesn't ask them who they are. */
  currentDoctorId: string | null;
  canPickDoctor: boolean;
};

export function PatientWorkspaceView(props: Props) {
  const {
    group,
    services,
    embedded = false,
    showHeader = true,
    forcedToothFdi = null,
    demoReview = null,
    localOnly = false,
    doctors,
    serviceDoctorMappings,
    canPropose,
    canBook = true,
    canEditProfile = true,
    canEditBilling,
    billingBalance,
    currentDoctorId,
    canPickDoctor,
  } = props;
  const { locale } = useLocale();
  const [balance, setBalance] = useState(billingBalance);
  const [billingOpen, setBillingOpen] = useState(false);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
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
      {showHeader ? (
        <WorkspaceHeader
          group={group}
          onBill={canPropose ? () => setBillDialogOpen(true) : undefined}
        />
      ) : null}
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
            doctors={doctors}
            serviceDoctorMappings={serviceDoctorMappings}
            canPropose={canPropose}
            canBook={canBook}
            canEditProfile={canEditProfile}
            currentDoctorId={currentDoctorId}
            canPickDoctor={canPickDoctor}
          />
        </div>
      </div>
      {!embedded && canEditBilling ? (
        <div className="border-t border-[#e5e7eb] px-4 py-4 md:px-6 md:py-5">
          <button
            type="button"
            onClick={() => setBillingOpen((prev) => !prev)}
            className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--admin-muted)]"
          >
            {billingOpen ? "▾" : "▸"} Billing —{" "}
            <span className={balance > 0 ? "text-red-600" : "text-emerald-600"}>
              {formatEgp(Math.abs(balance), locale)}
              {balance > 0 ? " owed" : balance < 0 ? " credit" : ""}
            </span>
          </button>
          {billingOpen ? (
            <div className="mt-3">
              <AddChargeForm
                patientKey={group.patientKey}
                services={services}
                doctors={doctors}
                serviceDoctorMappings={serviceDoctorMappings}
                reservations={group.visits}
                balance={balance}
                onRecorded={(entry) => setBalance(entry.balanceAfter)}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      <WorkspaceOverlays group={group} services={services} w={w} />
      <BillPatientDialog
        open={billDialogOpen}
        onOpenChange={setBillDialogOpen}
        patientKey={group.patientKey}
        patientPhone={group.phone}
        patientName={group.displayName}
        reservations={group.visits}
        currentDoctorId={currentDoctorId}
        canPickDoctor={canPickDoctor}
      />
    </div>
  );
}
