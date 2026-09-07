"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "../RichTextEditor";
import { ToothCombobox } from "../ToothCombobox";
import type { ToothOption } from "../toothCatalog";
import type { PatientTreatmentAttachment } from "@/services/patient_treatments";
import { TreatmentAttachmentsField } from "./TreatmentAttachmentsField";

export type TreatmentDraft = {
  tooth_name: string;
  tooth_fdi: string;
  severity: "Critical" | "Minor";
  last_treatment: string;
  ai_title: string;
  ai_description: string;
  ai_confidence: string;
  ai_recommendation: string;
  status: "open" | "scheduled" | "done";
  cdt_code: string;
  fee_amount: number;
};

export type PendingFile = { file: File; asXray: boolean };

type Props = {
  initial: TreatmentDraft;
  pending: boolean;
  savedAttachments: PatientTreatmentAttachment[];
  pendingFiles: PendingFile[];
  onPendingFilesChange: (files: PendingFile[]) => void;
  onRemoveSavedAttachment?: (id: string) => void;
  onCancel: () => void;
  onSubmit: (draft: TreatmentDraft) => void;
};

export function TreatmentEditorForm({
  initial,
  pending,
  savedAttachments,
  pendingFiles,
  onPendingFilesChange,
  onRemoveSavedAttachment,
  onCancel,
  onSubmit,
}: Props) {
  const [draft, setDraft] = useState(initial);

  function pickTooth(tooth: ToothOption) {
    setDraft({ ...draft, tooth_fdi: tooth.fdi, tooth_name: tooth.name });
  }

  const canSave = Boolean(draft.tooth_name.trim() && draft.tooth_fdi);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        <Field label="Tooth">
          <ToothCombobox
            fdi={draft.tooth_fdi}
            disabled={pending}
            onSelect={pickTooth}
          />
          <p className="mt-1 text-[11px] text-[#9ca3af]">
            Search here or select a tooth on the chart, then click Add.
          </p>
        </Field>
        <Field label="Severity">
          <select
            value={draft.severity}
            disabled={pending}
            onChange={(e) =>
              setDraft({
                ...draft,
                severity: e.target.value as TreatmentDraft["severity"],
              })
            }
            className="h-9 w-full rounded-lg bg-[#f2f2f2] px-3 text-sm"
          >
            <option value="Critical">Critical</option>
            <option value="Minor">Minor</option>
          </select>
        </Field>
        <Field label="CDT code">
          <Input
            value={draft.cdt_code}
            disabled={pending}
            onChange={(e) =>
              setDraft({
                ...draft,
                cdt_code: e.target.value.trim().toUpperCase(),
              })
            }
            placeholder="D2391"
          />
        </Field>
        <Field label="Fee (EGP)">
          <Input
            inputMode="numeric"
            value={draft.fee_amount === 0 ? "" : String(draft.fee_amount)}
            disabled={pending}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, "");
              setDraft({
                ...draft,
                fee_amount: raw === "" ? 0 : Number.parseInt(raw, 10),
              });
            }}
            placeholder="0"
          />
        </Field>
        <Field label="Last treatment">
          <RichTextEditor
            value={draft.last_treatment}
            disabled={pending}
            onChange={(html) => setDraft({ ...draft, last_treatment: html })}
            placeholder="What was done previously…"
          />
        </Field>
        <Field label="Title (optional)">
          <Input
            value={draft.ai_title}
            disabled={pending}
            onChange={(e) => setDraft({ ...draft, ai_title: e.target.value })}
          />
        </Field>
        <Field label="Description">
          <RichTextEditor
            value={draft.ai_description}
            disabled={pending}
            onChange={(html) => setDraft({ ...draft, ai_description: html })}
            placeholder="Clinical description…"
          />
        </Field>
        <Field label="Confidence %">
          <Input
            inputMode="numeric"
            value={draft.ai_confidence}
            disabled={pending}
            onChange={(e) =>
              setDraft({ ...draft, ai_confidence: e.target.value })
            }
            placeholder="75"
          />
        </Field>
        <Field label="Recommendation">
          <RichTextEditor
            value={draft.ai_recommendation}
            disabled={pending}
            onChange={(html) =>
              setDraft({ ...draft, ai_recommendation: html })
            }
            placeholder="Recommended next step…"
            minHeightClass="min-h-20"
          />
        </Field>
        <Field label="Attachments & X-rays">
          <TreatmentAttachmentsField
            attachments={savedAttachments}
            pendingFiles={pendingFiles}
            pending={pending}
            onAddFiles={(files, asXray) =>
              onPendingFilesChange([
                ...pendingFiles,
                ...Array.from(files).map((file) => ({ file, asXray })),
              ])
            }
            onRemovePending={(index) =>
              onPendingFilesChange(pendingFiles.filter((_, i) => i !== index))
            }
            onRemoveSaved={onRemoveSavedAttachment}
          />
        </Field>
      </div>
      <div className="flex gap-2 p-5">
        <Button
          type="button"
          disabled={pending || !canSave}
          onClick={() => onSubmit(draft)}
        >
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
