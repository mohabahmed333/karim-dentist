"use client";

import { addableCatalog, GROUP_LABELS, GROUP_ORDER } from "@/services/cdt";

type Props = {
  menuCodes: ReadonlySet<string>;
  disabled?: boolean;
  onAdd: (code: string) => void;
};

export function ClinicMenuAddPicker({ menuCodes, disabled, onAdd }: Props) {
  const addable = addableCatalog(menuCodes);
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-[#1E293B]">Clinic prices</p>
      <select
        aria-label="Add treatment"
        disabled={disabled || addable.length === 0}
        value=""
        onChange={(event) => {
          const code = event.target.value;
          if (code) onAdd(code);
        }}
        className="h-9 max-w-56 rounded-md border border-input bg-background px-2 text-sm"
      >
        <option value="">
          {addable.length === 0 ? "All added" : "Add treatment"}
        </option>
        {GROUP_ORDER.map((group) => {
          const rows = addable.filter((row) => row.group === group);
          if (rows.length === 0) return null;
          return (
            <optgroup key={group} label={GROUP_LABELS[group]}>
              {rows.map((row) => (
                <option key={row.code} value={row.code}>
                  {row.shortLabel}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </div>
  );
}
