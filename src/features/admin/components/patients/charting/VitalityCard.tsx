"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { vitalitySoap } from "@/services/charting/soap";

type Cold = "normal" | "lingering" | "negative";

type Props = {
  pending: boolean;
  onSave: (body: string) => Promise<void>;
};

export function VitalityCard({ pending, onSave }: Props) {
  const [cold, setCold] = useState<Cold | "">("");
  const [ept, setEpt] = useState(40);
  const [percussion, setPercussion] = useState<"negative" | "positive">(
    "negative",
  );
  const [mobility, setMobility] = useState<0 | 1 | 2 | 3>(0);

  async function save() {
    if (!cold) return;
    await onSave(
      vitalitySoap({ cold, ept, percussion, mobility }),
    );
    setCold("");
    setEpt(40);
    setPercussion("negative");
    setMobility(0);
  }

  return (
    <div className="space-y-3 text-sm">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-[#64748B]">
        Pulp vitality
      </p>
      <div className="flex flex-wrap gap-1">
        {(["normal", "lingering", "negative"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setCold(id)}
            className={`rounded-full px-3 py-1 text-xs ${
              cold === id ? "bg-[#2563EB] text-white" : "bg-[#F1F5F9] text-[#64748B]"
            }`}
          >
            Cold {id}
          </button>
        ))}
      </div>
      <label className="block text-xs text-[#64748B]">
        EPT {ept}
        <input
          type="range"
          min={0}
          max={80}
          value={ept}
          onChange={(e) => setEpt(Number(e.target.value))}
          className="mt-1 w-full"
        />
      </label>
      <div className="flex gap-2 text-xs">
        <button type="button" onClick={() => setPercussion("negative")}>
          Perc {percussion === "negative" ? "−" : ""}
        </button>
        <button type="button" onClick={() => setPercussion("positive")}>
          Perc {percussion === "positive" ? "+" : "+"}
        </button>
        {[0, 1, 2, 3].map((n) => (
          <button key={n} type="button" onClick={() => setMobility(n as 0 | 1 | 2 | 3)}>
            Mob {n === 0 ? "0" : ["I", "II", "III"][n - 1]}
          </button>
        ))}
      </div>
      <Button type="button" size="sm" disabled={!cold || pending} onClick={() => void save()}>
        Save to SOAP
      </Button>
    </div>
  );
}
