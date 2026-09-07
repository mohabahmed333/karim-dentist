"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PatientTreatmentAttachment, TreatmentAppointment } from "@/services/patient_treatments";
import { RichTextEditor } from "../RichTextEditor";
import { TreatmentAttachmentsField } from "../treatments/TreatmentAttachmentsField";
import type { PendingFile } from "../treatments/TreatmentEditorForm";
import { ChatBookedBanner } from "./ChatBookedBanner";
import type { WizardDraft, WizardStep } from "./wizardModel";
import { WizardTreatmentStep } from "./WizardTreatmentStep";
import { WIZARD_CARD, WIZARD_INK, WIZARD_MUTE } from "./wizardSkin";

type Props = {
  step: WizardStep;
  draft: WizardDraft;
  pending: boolean;
  pendingFiles: PendingFile[];
  savedAttachments?: PatientTreatmentAttachment[];
  existingAppointment?: TreatmentAppointment | null;
  onDraft: (next: WizardDraft) => void;
  onPendingFiles: (files: PendingFile[]) => void;
  onRemoveSavedAttachment?: (id: string) => void;
  onBook: () => void;
};

export function TreatmentWizardBody({
  step,
  draft,
  pending,
  pendingFiles,
  savedAttachments = [],
  existingAppointment = null,
  onDraft,
  onPendingFiles,
  onRemoveSavedAttachment,
  onBook,
}: Props) {
  if (step === "treatment") {
    return (
      <WizardTreatmentStep draft={draft} pending={pending} onDraft={onDraft} />
    );
  }

  if (step === "severity") {
    return (
      <Field label="Severity">
        <select
          value={draft.severity}
          disabled={pending}
          onChange={(e) =>
            onDraft({
              ...draft,
              severity: e.target.value as WizardDraft["severity"],
            })
          }
          className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#1E293B]"
        >
          <option value="Minor">Minor</option>
          <option value="Critical">Critical</option>
        </select>
      </Field>
    );
  }

  if (step === "last") {
    return (
      <Field label="Last treatment">
        <div className={`${WIZARD_CARD} p-2`}>
          <RichTextEditor
            value={draft.last_treatment}
            disabled={pending}
            onChange={(html) => onDraft({ ...draft, last_treatment: html })}
            placeholder="What was done previously…"
          />
        </div>
      </Field>
    );
  }

  if (step === "clinical") {
    return (
      <div className="space-y-4">
        <Field label="Title (optional)">
          <Input
            value={draft.ai_title}
            disabled={pending}
            onChange={(e) => onDraft({ ...draft, ai_title: e.target.value })}
            className="h-11 rounded-lg border-[#E2E8F0] bg-white"
          />
        </Field>
        <Field label="Description">
          <div className={`${WIZARD_CARD} p-2`}>
            <RichTextEditor
              value={draft.ai_description}
              disabled={pending}
              onChange={(html) => onDraft({ ...draft, ai_description: html })}
              placeholder="Clinical description…"
            />
          </div>
        </Field>
        <Field label="Confidence %">
          <Input
            inputMode="numeric"
            value={draft.ai_confidence}
            disabled={pending}
            onChange={(e) =>
              onDraft({ ...draft, ai_confidence: e.target.value })
            }
            placeholder="75"
            className="h-11 rounded-lg border-[#E2E8F0] bg-white"
          />
        </Field>
        <Field label="Recommendation">
          <div className={`${WIZARD_CARD} p-2`}>
            <RichTextEditor
              value={draft.ai_recommendation}
              disabled={pending}
              onChange={(html) =>
                onDraft({ ...draft, ai_recommendation: html })
              }
              placeholder="Recommended next step…"
              minHeightClass="min-h-20"
            />
          </div>
        </Field>
      </div>
    );
  }

  if (step === "attachments") {
    return (
      <Field label="Attachments & X-rays">
        <div className={`${WIZARD_CARD} p-3`}>
          <TreatmentAttachmentsField
            attachments={savedAttachments}
            pendingFiles={pendingFiles}
            pending={pending}
            onAddFiles={(files, asXray) => {
              const incoming = Array.from(files).map((file) => ({
                file,
                asXray,
              }));
              const next = incoming.filter(
                (item) =>
                  !pendingFiles.some(
                    (prev) =>
                      prev.file.name === item.file.name &&
                      prev.file.size === item.file.size &&
                      prev.asXray === item.asXray,
                  ),
              );
              if (next.length === 0) return;
              onPendingFiles([...pendingFiles, ...next]);
            }}
            onRemovePending={(index) =>
              onPendingFiles(pendingFiles.filter((_, i) => i !== index))
            }
            onRemoveSaved={onRemoveSavedAttachment}
          />
        </div>
      </Field>
    );
  }

  return (
    <div className={`${WIZARD_CARD} space-y-3 p-4`}>
      {existingAppointment ? (
        <>
          <p className={`text-sm font-semibold ${WIZARD_INK}`}>
            Appointment already booked
          </p>
          <ChatBookedBanner appointment={existingAppointment} />
          <button
            type="button"
            onClick={onBook}
            className="w-full rounded-full border border-[#C5C9D2] bg-white py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#F8F9FB]"
          >
            Reschedule appointment
          </button>
        </>
      ) : (
        <>
          <p className={`text-sm font-semibold ${WIZARD_INK}`}>
            Book an appointment?
          </p>
          <p className={`text-[12px] ${WIZARD_MUTE}`}>
            Treatment is saved. Schedule now or skip and book later from the
            list.
          </p>
          <button
            type="button"
            onClick={onBook}
            className="w-full rounded-full bg-[#0D2137] py-2.5 text-sm font-semibold text-white hover:bg-[#132A45]"
          >
            Book appointment
          </button>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className={`text-[13px] font-semibold ${WIZARD_INK}`}>{label}</Label>
      {children}
    </div>
  );
}
