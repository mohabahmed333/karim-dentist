"use client";

import { useState } from "react";
import type { PendingFile } from "../treatments/TreatmentEditorForm";
import { TreatmentWizardBody } from "./TreatmentWizardBody";
import { TreatmentWizardNav } from "./TreatmentWizardNav";
import { TreatmentWizardTabs } from "./TreatmentWizardTabs";
import {
  WIZARD_STEPS,
  draftToUpsert,
  emptyWizardDraft,
  wizardCanAdvance,
  type WizardDraft,
  type WizardStep,
} from "./wizardModel";
import { WIZARD_BG, WIZARD_INK, WIZARD_MUTE, WIZARD_SOFT } from "./wizardSkin";
import type {
  PatientTreatmentAttachment,
  TreatmentAppointment,
} from "@/services/patient_treatments";
import { toast } from "sonner";

type Props = {
  toothFdi: string;
  toothName: string;
  pending: boolean;
  initialDraft?: WizardDraft;
  alreadySaved?: boolean;
  existingTreatmentId?: string | null;
  existingAppointment?: TreatmentAppointment | null;
  savedAttachments?: PatientTreatmentAttachment[];
  onCancel: () => void;
  onSave: (
    raw: unknown,
    files: PendingFile[],
  ) => Promise<string | null | undefined>;
  onRemoveSavedAttachment?: (id: string) => void;
  onBook: (treatmentId: string) => void;
  onDone: () => void;
};

export function TreatmentWizard({
  toothFdi,
  toothName,
  pending,
  initialDraft,
  alreadySaved = false,
  existingTreatmentId = null,
  existingAppointment = null,
  savedAttachments = [],
  onCancel,
  onSave,
  onRemoveSavedAttachment,
  onBook,
  onDone,
}: Props) {
  const [step, setStep] = useState<WizardStep>("treatment");
  const [draft, setDraft] = useState<WizardDraft>(
    () => initialDraft ?? emptyWizardDraft(toothFdi, toothName),
  );
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [savedId, setSavedId] = useState<string | null>(existingTreatmentId);

  const index = WIZARD_STEPS.indexOf(step);
  const reviewMode = alreadySaved;

  async function saveDraft() {
    const id = await onSave(draftToUpsert(draft), pendingFiles);
    if (!id) return null;
    setSavedId(id);
    setPendingFiles([]);
    return id;
  }

  async function goNext() {
    if (reviewMode) {
      if (step === "book") {
        onDone();
        return;
      }
      return;
    }
    if (step === "attachments") {
      const id = await saveDraft();
      if (!id) return;
      setStep("book");
      return;
    }
    if (step === "book") {
      onDone();
      return;
    }
    setStep(WIZARD_STEPS[index + 1] ?? "book");
  }

  async function handleReviewSave() {
    const id = await saveDraft();
    if (id) toast.success("Treatment updated");
  }

  return (
    <div className={`flex h-full min-h-0 flex-1 flex-col ${WIZARD_BG}`}>
      <div className="shrink-0 px-4 pt-4 pb-2">
        <p
          className={`text-[11px] font-semibold tracking-wide uppercase ${WIZARD_SOFT}`}
        >
          {alreadySaved
            ? "Review required treatment"
            : "Add required treatment"}
        </p>
        <p className={`mt-0.5 text-sm font-semibold ${WIZARD_INK}`}>
          {toothName}
          <span className={`ms-1 font-normal ${WIZARD_MUTE}`}>
            · {toothFdi}
          </span>
        </p>
        {alreadySaved ? (
          <p className={`mt-1 text-[11px] ${WIZARD_MUTE}`}>
            Already saved — reviewing existing record (won’t create a
            duplicate).
          </p>
        ) : null}
      </div>

      {reviewMode ? (
        <TreatmentWizardTabs step={step} onSelect={setStep} />
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <TreatmentWizardBody
          step={step}
          draft={draft}
          pending={pending}
          pendingFiles={pendingFiles}
          savedAttachments={savedAttachments}
          existingAppointment={existingAppointment}
          onDraft={setDraft}
          onPendingFiles={setPendingFiles}
          onRemoveSavedAttachment={onRemoveSavedAttachment}
          onBook={() => {
            if (savedId) onBook(savedId);
          }}
        />
      </div>

      <TreatmentWizardNav
        step={step}
        pending={pending}
        canNext={
          reviewMode
            ? Boolean(draft.cdt_code?.trim())
            : wizardCanAdvance(step, draft)
        }
        reviewMode={reviewMode}
        onBack={() => {
          if (index > 0 && step !== "book") {
            setStep(WIZARD_STEPS[index - 1] ?? "treatment");
          }
        }}
        onNext={() => void goNext()}
        onCancel={onCancel}
        onSave={() => void handleReviewSave()}
      />
    </div>
  );
}
