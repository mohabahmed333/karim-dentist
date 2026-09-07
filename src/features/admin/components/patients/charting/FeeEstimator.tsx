"use client";

import {
  FEE_RATE_PRESETS,
  feeRateFromPct,
  feeSummary,
  formatEgp,
} from "@/services/cdt";
import type { TreatmentItem } from "@/services/patient_treatments";

type Props = {
  items: TreatmentItem[];
  insurancePct: number;
  onInsurancePct: (value: number) => void;
};

export function FeeEstimator({ items, insurancePct, onInsurancePct }: Props) {
  const rate = feeRateFromPct(insurancePct);
  const summary = feeSummary(
    items.map((item) => ({ status: item.status, fee_amount: item.feeAmount })),
    insurancePct,
  );

  return (
    <div className="space-y-2 rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] p-3">
      <p className="text-[12px] font-semibold text-[#1E293B]">Fee estimate</p>
      <div className="flex flex-col gap-1.5">
        {FEE_RATE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-pressed={rate === preset.id}
            onClick={() => onInsurancePct(preset.discountPct)}
            className={`rounded-full px-3 py-1.5 text-start text-[11px] font-medium ${
              rate === preset.id
                ? "bg-[#2563EB] text-white"
                : "border border-[#E2E8F0] bg-[#EEF2F6] text-[#1E293B]"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <dl className="space-y-1 text-[12px] text-[#475569]">
        <div className="flex justify-between">
          <dt>Total Fee</dt>
          <dd>{formatEgp(summary.totalFee)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Discount</dt>
          <dd>{formatEgp(summary.discount)}</dd>
        </div>
        <div className="flex justify-between font-semibold text-[#1E293B]">
          <dt>Final Patient Balance</dt>
          <dd>{formatEgp(summary.balance)}</dd>
        </div>
      </dl>
    </div>
  );
}
