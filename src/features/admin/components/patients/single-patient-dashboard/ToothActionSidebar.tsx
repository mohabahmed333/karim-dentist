"use client";

import { useState } from "react";
import { AI_ASSIST_CHIPS, CDT_QUICK_ACTIONS } from "./clinicalCatalog";
import { labelForTooth, fdiFromUniversal } from "./queueHelpers";
import type { CdtQuickAction } from "./clinicalTypes";

type Props = {
  selectedUniversal: number | null;
  onQuickAction: (action: CdtQuickAction) => void;
};

export function ToothActionSidebar({
  selectedUniversal,
  onQuickAction,
}: Props) {
  const [notes, setNotes] = useState("");
  const fdi =
    selectedUniversal != null ? fdiFromUniversal(selectedUniversal) : null;

  if (selectedUniversal === null) {
    return (
      <aside className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">
          Select a tooth on the 3D arch to begin charting.
        </p>
      </aside>
    );
  }

  return (
    <aside className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Active selection
        </p>
        <h2 className="mt-1 text-base font-semibold text-slate-900">
          {labelForTooth(selectedUniversal, fdi)}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {CDT_QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => onQuickAction(action)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-2.5 text-start text-[12px] font-medium text-slate-800 hover:border-blue-600 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <span className="block">{action.label}</span>
            <span className="mt-0.5 block text-[10px] font-normal text-slate-400">
              {action.cdtCode}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          AI Assist
        </p>
        <div className="flex flex-wrap gap-1.5">
          {AI_ASSIST_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setNotes(chip.narrative)}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-slate-900 hover:bg-white"
            >
              {chip.label}
            </button>
          ))}
        </div>
        <label htmlFor="ai-narrative" className="sr-only">
          Clinical note narrative
        </label>
        <textarea
          id="ai-narrative"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Auto-generated clinical note…"
          className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        />
      </div>
    </aside>
  );
}
