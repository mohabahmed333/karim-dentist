"use client";

import { motion } from "framer-motion";
import { DASHBOARD_TABS } from "./dashboard-data";
import type { DashboardTab } from "./dashboard.types";

type Props = {
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
};

export function DashboardTabBar({ active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Patient history views"
      className="relative flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-[#E2E8F0] px-1.5 py-1.5"
    >
      {DASHBOARD_TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`relative shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
              selected ? "text-white" : "text-[#6b6b6b] hover:text-[#111111]"
            }`}
          >
            {selected ? (
              <motion.span
                layoutId="patient-tab-pill"
                className="absolute inset-0 rounded-full bg-[#111111]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
