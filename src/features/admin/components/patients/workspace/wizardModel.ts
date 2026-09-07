import { defaultPhaseForCdt } from "@/services/cdt";
import type { TreatmentItem } from "@/services/patient_treatments";
import type { TreatmentDraft } from "../treatments/TreatmentEditorForm";

export const WIZARD_STEPS = [
  "treatment",
  "severity",
  "last",
  "clinical",
  "attachments",
  "book",
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number];

export type WizardDraft = TreatmentDraft & {
  cdt_code: string;
  fee_amount: number;
};

/** How the review wizard should open. */
export type WizardLaunch = {
  treatmentId: string | "new";
  draft: WizardDraft;
};

export const WIZARD_LABELS: Record<WizardStep, string> = {
  treatment: "Treatment",
  severity: "Severity",
  last: "Last treatment",
  clinical: "Clinical",
  attachments: "Attachments",
  book: "Book",
};

export function emptyWizardDraft(
  toothFdi: string,
  toothName: string,
): WizardDraft {
  return {
    tooth_name: toothName,
    tooth_fdi: toothFdi,
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

export function wizardDraftFromAi(
  toothFdi: string,
  toothName: string,
  ai: {
    cdt_code?: string;
    fee_amount?: number;
    severity?: "Minor" | "Critical";
    last_treatment?: string;
    ai_title?: string;
    ai_description?: string;
    ai_confidence?: string;
    ai_recommendation?: string;
  },
): WizardDraft {
  return {
    ...emptyWizardDraft(toothFdi, toothName),
    cdt_code: ai.cdt_code ?? "",
    fee_amount: ai.fee_amount ?? 0,
    severity: ai.severity ?? "Minor",
    last_treatment: ai.last_treatment ?? "",
    ai_title: ai.ai_title ?? "",
    ai_description: ai.ai_description ?? "",
    ai_confidence: ai.ai_confidence ?? "",
    ai_recommendation: ai.ai_recommendation ?? "",
  };
}

export function wizardDraftFromTreatment(item: TreatmentItem): WizardDraft {
  return {
    tooth_name: item.toothName,
    tooth_fdi: item.toothFdi ?? "",
    severity: item.severity,
    last_treatment: item.lastTreatment ?? "",
    ai_title: item.aiInsight?.title ?? "",
    ai_description: item.aiInsight?.description ?? "",
    ai_confidence:
      item.aiInsight?.confidence != null && item.aiInsight.confidence > 0
        ? String(item.aiInsight.confidence)
        : "",
    ai_recommendation: item.aiInsight?.recommendation ?? "",
    status: item.status,
    cdt_code: item.cdtCode ?? "",
    fee_amount: item.feeAmount,
  };
}

export function findExistingTreatmentForDraft(
  items: TreatmentItem[],
  toothFdi: string,
  cdtCode: string | undefined | null,
  preferredId?: string | null,
): TreatmentItem | null {
  if (preferredId) {
    const byId = items.find((item) => item.id === preferredId);
    if (byId) return byId;
  }
  const code = cdtCode?.trim();
  if (!code) return null;
  return (
    items.find(
      (item) =>
        item.toothFdi === toothFdi &&
        item.cdtCode === code &&
        item.status !== "done",
    ) ?? null
  );
}

export function draftToUpsert(draft: WizardDraft) {
  const confidence = draft.ai_confidence.trim();
  return {
    tooth_name: draft.tooth_name,
    tooth_fdi: draft.tooth_fdi,
    severity: draft.severity,
    last_treatment: draft.last_treatment,
    cdt_code: draft.cdt_code || null,
    phase: draft.cdt_code ? defaultPhaseForCdt(draft.cdt_code) : undefined,
    fee_amount: Math.max(0, Math.round(draft.fee_amount)),
    ai_title: draft.ai_title,
    ai_description: draft.ai_description,
    ai_confidence: confidence === "" ? null : Number.parseInt(confidence, 10),
    ai_recommendation: draft.ai_recommendation,
    status: draft.status,
  };
}

export function wizardCanAdvance(step: WizardStep, draft: WizardDraft): boolean {
  if (!draft.tooth_fdi || !draft.tooth_name.trim()) return false;
  if (step === "treatment") return Boolean(draft.cdt_code);
  return true;
}
