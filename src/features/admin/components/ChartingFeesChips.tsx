"use client";

import { chipLabelFor, formatEgp, resolveClinicMenu } from "@/services/cdt";
import { Label } from "@/components/ui/label";
import { SettingsSectionGroup } from "./SettingsSectionGroup";

type FeeDraft = { code: string; fee_egp: number };
type PresetDraft = { slot: number; code: string; label: string };

type Props = {
  fees: FeeDraft[];
  presets: PresetDraft[];
  onPresetChange: (slot: number, code: string) => void;
};

export function ChartingFeesChips({ fees, presets, onPresetChange }: Props) {
  const menu = resolveClinicMenu(fees);
  const feeByCode = new Map(fees.map((row) => [row.code, row.fee_egp]));
  return (
    <SettingsSectionGroup
      title="Chairside favorites"
      hint="Four buttons on the patient page. Price comes from the list below."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {presets.map((row) => (
          <div
            key={row.slot}
            className="space-y-2 rounded-xl border border-[var(--admin-border)] p-3"
          >
            <Label htmlFor={`chip-${row.slot}`}>Slot {row.slot}</Label>
            <select
              id={`chip-${row.slot}`}
              value={row.code}
              onChange={(event) => onPresetChange(row.slot, event.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {menu.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.shortLabel}
                </option>
              ))}
              {menu.some((item) => item.code === row.code) ? null : (
                <option value={row.code}>{chipLabelFor(row.code)}</option>
              )}
            </select>
            <p className="text-xs text-[var(--admin-muted)]">
              {chipLabelFor(row.code)} · {formatEgp(feeByCode.get(row.code) ?? 0)}
            </p>
          </div>
        ))}
      </div>
    </SettingsSectionGroup>
  );
}
