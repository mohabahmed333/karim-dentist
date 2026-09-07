"use client";

import { motion } from "framer-motion";
import {
  PATIENT_VIEW_TABS,
  type PatientView,
} from "./recordsPane";

type Props = {
  active: PatientView;
  onChange: (view: PatientView) => void;
};

export function PatientViewTabs({ active, onChange }: Props) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <div
        role="tablist"
        aria-label="Patient views"
        className="pointer-events-auto relative flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-[#E2E8F0] bg-[#F8F9FA]/95 px-1.5 py-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-md"
      >
        {PATIENT_VIEW_TABS.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.id)}
              className={`relative shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                selected
                  ? "text-white"
                  : "text-[#64748B] hover:text-[#1E293B]"
              }`}
            >
              {selected ? (
                <motion.span
                  layoutId="patient-view-pill"
                  className="absolute inset-0 rounded-full bg-[#111111]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
