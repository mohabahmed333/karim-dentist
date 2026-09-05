"use client";

import { VIEW_TABS, type ViewTab } from "./clinicalTypes";

type Props = {
  active: ViewTab;
  onChange: (tab: ViewTab) => void;
};

export function ViewSwitcher({ active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Patient views"
      className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-slate-200 bg-white p-1"
    >
      {VIEW_TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              selected
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
