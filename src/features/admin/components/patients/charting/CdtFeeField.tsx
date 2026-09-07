"use client";

import { useEffect, useRef, useState } from "react";
import { formatEgp, parseChartingFee } from "@/services/cdt";

type Props = {
  amount: number;
  editing: boolean;
  onBegin: () => void;
  onCommit: (fee: number) => void;
  onEnd: () => void;
};

export function CdtFeeField({ amount, editing, onBegin, onCommit, onEnd }: Props) {
  const [draft, setDraft] = useState(String(amount));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(String(amount));
  }, [amount]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commit(raw: string) {
    const parsed = parseChartingFee(raw);
    if (parsed === null) {
      setDraft(String(amount));
    } else if (parsed !== amount) {
      onCommit(parsed);
    }
    onEnd();
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={onBegin}
        className="rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[#1E293B] hover:bg-[#EFF6FF]"
        aria-label="Procedure fee in EGP"
      >
        {formatEgp(amount)}
      </button>
    );
  }

  return (
    <label className="flex items-center gap-1 text-[11px] text-[#64748B]">
      EGP
      <input
        ref={inputRef}
        inputMode="numeric"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => commit(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setDraft(String(amount));
            onEnd();
          }
        }}
        className="h-6 w-20 rounded-md border border-[#2563EB] bg-white px-1.5 text-[11px] text-[#1E293B]"
        aria-label="Procedure fee in EGP"
      />
    </label>
  );
}
