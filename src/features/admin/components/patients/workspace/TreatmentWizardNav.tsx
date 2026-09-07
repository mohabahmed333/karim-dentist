"use client";

import { WIZARD_LABELS, WIZARD_STEPS, type WizardStep } from "./wizardModel";
import {
  WIZARD_MUTE,
  WIZARD_NAVY,
  WIZARD_STEP_ACTIVE,
  WIZARD_STEP_IDLE,
} from "./wizardSkin";

type Props = {
  step: WizardStep;
  pending: boolean;
  canNext: boolean;
  reviewMode?: boolean;
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
  onSave?: () => void;
};

export function TreatmentWizardNav({
  step,
  pending,
  canNext,
  reviewMode = false,
  onBack,
  onNext,
  onCancel,
  onSave,
}: Props) {
  const index = WIZARD_STEPS.indexOf(step);
  const last = index === WIZARD_STEPS.length - 1;
  const saveStep = step === "attachments";

  if (reviewMode) {
    return (
      <div className="shrink-0 border-t border-[#E8EAED] bg-[#F8F9FB] px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className={`text-[13px] font-medium ${WIZARD_MUTE} hover:text-[#111111] disabled:opacity-40`}
          >
            Cancel
          </button>
          {step !== "book" && onSave ? (
            <button
              type="button"
              disabled={pending || !canNext}
              onClick={onSave}
              className={`ms-auto rounded-full px-5 py-2 text-[13px] font-semibold disabled:opacity-40 ${WIZARD_NAVY}`}
            >
              {pending ? "Saving…" : "Save"}
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={onNext}
              className={`ms-auto rounded-full px-5 py-2 text-[13px] font-semibold disabled:opacity-40 ${WIZARD_NAVY}`}
            >
              Done
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-[#E8EAED] bg-[#F8F9FB] px-4 py-3">
      <ol className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {WIZARD_STEPS.map((id, i) => (
          <li
            key={id}
            className={`text-[11px] font-medium ${
              i === index
                ? `rounded-full border border-[#111111] px-2.5 py-1 ${WIZARD_STEP_ACTIVE}`
                : WIZARD_STEP_IDLE
            }`}
          >
            {i + 1}. {WIZARD_LABELS[id]}
          </li>
        ))}
      </ol>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className={`text-[13px] font-medium ${WIZARD_MUTE} hover:text-[#111111] disabled:opacity-40`}
        >
          Cancel
        </button>
        {index > 0 && step !== "book" ? (
          <button
            type="button"
            onClick={onBack}
            disabled={pending}
            className="rounded-full border border-[#E8EAED] bg-white px-4 py-2 text-[13px] font-semibold text-[#111111] disabled:opacity-40"
          >
            Back
          </button>
        ) : null}
        <button
          type="button"
          disabled={pending || (!last && !canNext)}
          onClick={onNext}
          className={`ms-auto rounded-full px-5 py-2 text-[13px] font-semibold disabled:opacity-40 ${WIZARD_NAVY}`}
        >
          {pending
            ? "Saving…"
            : last
              ? "Done"
              : saveStep
                ? "Save & continue"
                : "Next"}
        </button>
      </div>
    </div>
  );
}
