"use client";

import type { DiagnosticStats } from "./shellTypes";

type Props = {
  toothLabel: string;
  stats: DiagnosticStats;
  onChange: (next: DiagnosticStats) => void;
  onSave: () => void;
};

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-[11px] font-medium text-[#6b7280]" htmlFor={id}>
      {label}
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm text-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
      />
    </label>
  );
}

export function DiagnosticCard({ toothLabel, stats, onChange, onSave }: Props) {
  return (
    <div className="absolute bottom-3 left-3 right-3 z-20 max-w-md rounded-xl border border-[#e5e7eb] bg-white/95 p-3 shadow-sm backdrop-blur sm:left-auto sm:right-3 sm:w-72">
      <p className="mb-2 text-sm font-semibold text-[#111827]">{toothLabel}</p>
      <div className="grid grid-cols-2 gap-2">
        <Field
          id="cold"
          label="Cold response"
          value={stats.coldResponse}
          onChange={(coldResponse) => onChange({ ...stats, coldResponse })}
        />
        <Field
          id="ept"
          label="EPT score"
          value={stats.eptScore}
          onChange={(eptScore) => onChange({ ...stats, eptScore })}
        />
        <Field
          id="percussion"
          label="Percussion"
          value={stats.percussion}
          onChange={(percussion) => onChange({ ...stats, percussion })}
        />
        <Field
          id="mobility"
          label="Mobility"
          value={stats.mobility}
          onChange={(mobility) => onChange({ ...stats, mobility })}
        />
      </div>
      <label
        htmlFor="tooth-note"
        className="mt-2 block text-[11px] font-medium text-[#6b7280]"
      >
        Quick tooth note
        <textarea
          id="tooth-note"
          rows={2}
          value={stats.note}
          onChange={(e) => onChange({ ...stats, note: e.target.value })}
          className="mt-1 w-full resize-none rounded-md border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm text-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
        />
      </label>
      <button
        type="button"
        onClick={onSave}
        className="mt-2 rounded-md bg-[#2563eb] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1d4ed8]"
      >
        Save note
      </button>
    </div>
  );
}
