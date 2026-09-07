"use client";

import { WIZARD_LABELS, WIZARD_STEPS, type WizardStep } from "./wizardModel";

type Props = {
  step: WizardStep;
  onSelect: (step: WizardStep) => void;
};

export function TreatmentWizardTabs({ step, onSelect }: Props) {
  return (
    <div className="shrink-0 border-b border-[#E8EAED] bg-[#F8F9FB] px-4 pb-3">
      <div
        role="tablist"
        aria-label="Treatment sections"
        className="flex gap-1 overflow-x-auto rounded-xl bg-[#F1F3F5] p-1"
      >
        {WIZARD_STEPS.map((id) => {
          const active = id === step;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(id)}
              className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap transition-colors ${
                active
                  ? "border border-[#111111] bg-white text-[#111111]"
                  : "border border-transparent text-[#70758A] hover:text-[#111111]"
              }`}
            >
              {WIZARD_LABELS[id]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
