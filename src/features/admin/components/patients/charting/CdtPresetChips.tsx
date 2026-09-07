"use client";

import { useState } from "react";
import { chipLabelFor } from "@/services/cdt";
import { CdtChipGrid } from "./CdtChipGrid";
import { useChairsidePresets } from "./useChairsidePresets";

type Props = {
  toothLabel: string | null;
  hasTooth: boolean;
  onAdd: (code: string, fee: number) => void;
};

export function CdtPresetChips({ toothLabel, hasTooth, onAdd }: Props) {
  const { presets, moreItems, loading } = useChairsidePresets();
  const [showMore, setShowMore] = useState(false);

  if (!hasTooth) {
    return (
      <p className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#EEF2F6] px-3 py-2.5 text-[12px] text-[#64748B]">
        Select a tooth on the middle chart, then tap a treatment.
      </p>
    );
  }

  const favoriteChips = presets.map((preset) => ({
    id: preset.id,
    label: preset.label,
    code: preset.code,
    fee: preset.fee,
  }));
  const extraChips = moreItems.map((item) => ({
    id: item.code,
    label: chipLabelFor(item.code),
    code: item.code,
    fee: item.fee,
  }));

  return (
    <div className="rounded-2xl border border-[#2563EB]/20 bg-[#EEF2F6] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
        {toothLabel ? `Tooth ${toothLabel}` : "Selected tooth"}
      </p>
      {loading && presets.length === 0 ? (
        <p className="mt-2 text-[12px] text-[#64748B]">Loading treatments…</p>
      ) : (
        <>
          <CdtChipGrid
            items={showMore ? [...favoriteChips, ...extraChips] : favoriteChips}
            onAdd={onAdd}
          />
          {moreItems.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowMore((value) => !value)}
              className="mt-2 w-full rounded-xl border border-dashed border-[#2563EB]/40 bg-white px-2.5 py-2 text-[12px] font-semibold text-[#2563EB]"
            >
              {showMore ? "Fewer treatments" : "More treatments"}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
