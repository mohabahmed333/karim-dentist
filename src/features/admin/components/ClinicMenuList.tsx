"use client";

import { canRemoveFromMenu, resolveClinicMenu } from "@/services/cdt";
import { Input } from "@/components/ui/input";
import type { ClinicPresetRow } from "@/services/clinic_fees";

type FeeDraft = { code: string; fee_egp: number };

type Props = {
  fees: FeeDraft[];
  presets: ClinicPresetRow[];
  onFeeChange: (code: string, feeEgp: number) => void;
  onFeeBlur: (code: string, feeEgp: number) => void;
  onRemove: (code: string) => void;
};

export function ClinicMenuList({
  fees,
  presets,
  onFeeChange,
  onFeeBlur,
  onRemove,
}: Props) {
  const menu = resolveClinicMenu(fees);
  if (menu.length === 0) {
    return (
      <p className="text-sm text-[#64748B]">
        Add a treatment, then type the price.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-[#E2E8F0] overflow-hidden rounded-xl border border-[#E2E8F0]">
      {menu.map((row) => {
        const locked = !canRemoveFromMenu(row.code, presets);
        return (
          <li
            key={row.code}
            className="flex items-center gap-3 bg-white px-3 py-2"
          >
            <span className="min-w-0 flex-1 truncate text-sm text-[#1E293B]">
              {row.shortLabel}
            </span>
            <Input
              type="number"
              min={0}
              step={1}
              aria-label={`${row.shortLabel} fee in EGP`}
              className="h-8 w-24"
              value={row.fee}
              onChange={(event) =>
                onFeeChange(
                  row.code,
                  Math.max(0, Math.floor(Number(event.target.value) || 0)),
                )
              }
              onBlur={() => onFeeBlur(row.code, row.fee)}
            />
            <button
              type="button"
              disabled={locked}
              title={locked ? "Change this favorite first" : "Remove"}
              onClick={() => onRemove(row.code)}
              className="text-xs text-[#94A3B8] hover:text-[#EF4444] disabled:opacity-40"
            >
              Remove
            </button>
          </li>
        );
      })}
    </ul>
  );
}
