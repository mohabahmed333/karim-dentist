"use client";

import { useState } from "react";
import { perioSoap } from "@/services/charting/soap";

const SITES = ["DF", "F", "MF", "DL", "L", "ML"] as const;

function depthColor(n: number) {
  if (n >= 6) return "#EF4444";
  if (n >= 4) return "#F59E0B";
  return "#1E293B";
}

type Props = {
  pending: boolean;
  onSave: (body: string) => Promise<void>;
};

export function PerioStrip({ pending, onSave }: Props) {
  const [depths, setDepths] = useState([2, 2, 2, 2, 2, 2]);
  const [bop, setBop] = useState([false, false, false, false, false, false]);
  const [recF, setRecF] = useState(0);
  const [recL, setRecL] = useState(0);

  return (
    <div className="space-y-4 text-sm">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-[#64748B]">
        Perio quick-strip
      </p>
      <div className="overflow-hidden rounded-xl border border-[#E2E8F0]">
        <div className="grid grid-cols-6 bg-[#F8F9FA] text-center text-[10px] font-medium text-[#64748B]">
          {SITES.map((label) => (
            <span key={label} className="border-e border-[#E2E8F0] py-1 last:border-0">
              {label}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-6">
          {depths.map((depth, i) => (
            <input
              key={`d-${SITES[i]}`}
              type="number"
              min={1}
              max={9}
              aria-label={`${SITES[i]} probing depth`}
              value={depth}
              onChange={(e) => {
                const next = [...depths];
                next[i] = Math.min(9, Math.max(1, Number(e.target.value) || 1));
                setDepths(next);
              }}
              className="border-e border-[#E2E8F0] py-1.5 text-center text-xs last:border-0"
              style={{ color: depthColor(depth) }}
            />
          ))}
        </div>
        <div className="grid grid-cols-6 border-t border-[#E2E8F0] bg-[#F8F9FA]">
          {bop.map((on, i) => (
            <label
              key={`b-${SITES[i]}`}
              className="flex flex-col items-center gap-0.5 border-e border-[#E2E8F0] py-1.5 text-[9px] text-[#64748B] last:border-0"
            >
              BOP
              <input
                type="checkbox"
                checked={on}
                onChange={(e) => {
                  const next = [...bop];
                  next[i] = e.target.checked;
                  setBop(next);
                }}
              />
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-4 text-xs text-[#64748B]">
        <label>
          Rec F
          <input
            type="number"
            min={0}
            max={9}
            value={recF}
            onChange={(e) => setRecF(Number(e.target.value) || 0)}
            className="ms-1 w-12 rounded-md border border-[#E2E8F0] px-1 text-[#1E293B]"
          />
        </label>
        <label>
          Rec L
          <input
            type="number"
            min={0}
            max={9}
            value={recL}
            onChange={(e) => setRecL(Number(e.target.value) || 0)}
            className="ms-1 w-12 rounded-md border border-[#E2E8F0] px-1 text-[#1E293B]"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => void onSave(perioSoap({ depths, bop, recF, recL }))}
        className="h-9 w-full rounded-full bg-[#2563EB] text-xs font-medium text-white disabled:opacity-40"
      >
        Save to SOAP
      </button>
    </div>
  );
}
