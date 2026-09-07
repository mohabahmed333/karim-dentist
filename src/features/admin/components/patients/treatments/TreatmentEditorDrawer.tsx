"use client";

import { useState } from "react";
import type {
  PatientTreatmentAttachment,
  PatientTreatmentRow,
} from "@/services/patient_treatments";
import { SideDrawer } from "./SideDrawer";
import {
  TreatmentEditorForm,
  type PendingFile,
  type TreatmentDraft,
} from "./TreatmentEditorForm";

type Seed = { tooth_fdi: string; tooth_name: string } | null;

type Props = {
  open: boolean;
  pending: boolean;
  editing: PatientTreatmentRow | null;
  isNew: boolean;
  seed: Seed;
  onClose: () => void;
  onSave: (raw: unknown, pendingFiles: PendingFile[]) => void;
  onRemoveSavedAttachment: (attachmentId: string) => void;
};

function draftFrom(row: PatientTreatmentRow | null, seed: Seed): TreatmentDraft {
  if (!row) {
    return {
      tooth_name: seed?.tooth_name ?? "",
      tooth_fdi: seed?.tooth_fdi ?? "",
      severity: "Minor",
      last_treatment: "",
      ai_title: "",
      ai_description: "",
      ai_confidence: "",
      ai_recommendation: "",
      status: "open",
      cdt_code: "",
      fee_amount: 0,
    };
  }
  return {
    tooth_name: row.tooth_name,
    tooth_fdi: row.tooth_fdi ?? "",
    severity: row.severity,
    last_treatment: row.last_treatment,
    ai_title: row.ai_title ?? "",
    ai_description: row.ai_description ?? "",
    ai_confidence: row.ai_confidence != null ? String(row.ai_confidence) : "",
    ai_recommendation: row.ai_recommendation ?? "",
    status: row.status,
    cdt_code: row.cdt_code ?? "",
    fee_amount: row.fee_amount ?? 0,
  };
}

export function TreatmentEditorDrawer({
  open,
  pending,
  editing,
  isNew,
  seed,
  onClose,
  onSave,
  onRemoveSavedAttachment,
}: Props) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const saved: PatientTreatmentAttachment[] =
    editing?.patient_treatment_attachments ?? [];

  return (
    <SideDrawer
      open={open}
      title={isNew ? "Add treatment" : "Edit treatment"}
      onClose={() => {
        setPendingFiles([]);
        onClose();
      }}
    >
      <TreatmentEditorForm
        key={`${editing?.id ?? "new"}-${seed?.tooth_fdi ?? ""}`}
        initial={draftFrom(editing, isNew ? seed : null)}
        pending={pending}
        savedAttachments={saved}
        pendingFiles={pendingFiles}
        onPendingFilesChange={setPendingFiles}
        onRemoveSavedAttachment={
          editing ? onRemoveSavedAttachment : undefined
        }
        onCancel={() => {
          setPendingFiles([]);
          onClose();
        }}
        onSubmit={(next) => {
          onSave(
            {
              ...next,
              cdt_code: next.cdt_code.trim() || null,
              fee_amount: Math.max(0, Math.round(next.fee_amount)),
              ai_confidence:
                next.ai_confidence.trim() === ""
                  ? null
                  : Number.parseInt(next.ai_confidence, 10),
            },
            pendingFiles,
          );
          setPendingFiles([]);
        }}
      />
    </SideDrawer>
  );
}
