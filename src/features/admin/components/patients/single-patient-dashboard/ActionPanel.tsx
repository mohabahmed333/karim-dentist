"use client";

import { useState } from "react";
import type { QuickAction } from "./types";

const ACTIONS: QuickAction[] = ["Fill", "Crown", "Extract"];

const PLACEHOLDER_NOTE =
  "Patient presents with localized concern on the selected tooth. Recommend reviewing radiographs and confirming occlusion before proceeding with planned care.";

type Props = {
  selectedTooth: number | null;
  onQuickAction: (action: QuickAction) => void;
};

export function ActionPanel({ selectedTooth, onQuickAction }: Props) {
  const [notes, setNotes] = useState("");

  if (selectedTooth === null) {
    return (
      <aside
        aria-label="Clinical actions"
        className="rounded-xl border border-[#e5e7eb] bg-white p-4"
      >
        <p className="text-sm text-[#6b7280]">Select a tooth to begin charting.</p>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Clinical actions"
      className="flex h-full flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-white p-4"
    >
      <div>
        <h2 className="text-sm font-semibold text-[#111827]">Action panel</h2>
        <p className="mt-1 text-2xl font-semibold text-[#2563eb]">
          Tooth {selectedTooth}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => onQuickAction(action)}
            className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-medium text-[#111827] hover:border-[#2563eb] hover:bg-[#eff6ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          >
            {action}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <label htmlFor="ai-clinical-notes" className="text-sm font-medium text-[#111827]">
          AI Clinical Notes
        </label>
        <textarea
          id="ai-clinical-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          className="w-full resize-y rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9ca3af] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          placeholder="Notes for this tooth…"
        />
        <button
          type="button"
          onClick={() => setNotes(PLACEHOLDER_NOTE)}
          className="self-start rounded-md bg-[#2563eb] px-3 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
        >
          Generate Note
        </button>
      </div>
    </aside>
  );
}
