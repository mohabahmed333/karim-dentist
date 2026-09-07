"use client";

import { FlaskConical, Maximize2, Moon, Sun } from "lucide-react";
import { BentoMenu } from "./BentoMenu";
import { RxDrawerModal } from "./RxDrawerModal";
import { BentoPanel, CapsuleIcon, CircleIconButton } from "./BentoPanel";
import { rxKind, rxTimes, rxTiming } from "./bento-format";
import { RX_GRANULARITY_LABELS, type RxGranularity } from "@/services/dental_chart/bento";
import type { Prescription } from "@/services/dental_chart";

function TimingIcons({ timing }: { timing: "night" | "both" | "none" }) {
  if (timing === "none") return null;
  return (
    <span className="mb-0.5 flex justify-center gap-0.5 text-[#7a7a7a]">
      {timing === "both" ? <Sun className="size-2.5" /> : null}
      <Moon className="size-2.5" />
    </span>
  );
}

type Props = {
  prescriptions: Prescription[];
  granularity: RxGranularity;
  selectedRxId: string | null;
  drawerOpen: boolean;
  onGranularity: (value: RxGranularity) => void;
  onSelect: (id: string) => void;
  onDrawerOpen: (open: boolean) => void;
};

export function MedicationsRail({
  prescriptions,
  granularity,
  selectedRxId,
  drawerOpen,
  onGranularity,
  onSelect,
  onDrawerOpen,
}: Props) {
  const options = (Object.keys(RX_GRANULARITY_LABELS) as RxGranularity[]).map((value) => ({
    value,
    label: RX_GRANULARITY_LABELS[value],
  }));

  return (
    <BentoPanel
      title="Medications"
      actions={
        <div className="flex items-center gap-2">
          <BentoMenu label="Weeks" value={granularity} options={options} onChange={onGranularity} />
          <CircleIconButton label="Expand medications" onClick={() => onDrawerOpen(true)}>
            <Maximize2 className="size-3" />
          </CircleIconButton>
        </div>
      }
    >
      <div className="hx-bento-scroll flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
        {prescriptions.map((med) => {
          const active = med.id === selectedRxId;
          return (
            <article key={med.id} className="min-w-[158px] snap-start">
              <TimingIcons timing={rxTiming(med)} />
              <button
                type="button"
                onClick={() => onSelect(med.id)}
                className={`flex w-full items-center gap-2 rounded-full bg-white px-2 py-2 shadow-[0_8px_20px_rgba(17,17,17,0.06)] ${
                  active ? "ring-2 ring-[#E2F163]" : ""
                }`}
              >
                {rxKind(med) === "liquid" ? (
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#eceae4]">
                    <FlaskConical className="size-3.5 text-[#111111]" />
                  </span>
                ) : (
                  <CapsuleIcon highlight={med.frequency === "TWICE_DAILY"} />
                )}
                <span className="text-start">
                  <span className="block text-[12px] font-medium text-[#111111]">
                    {med.drugName} x {rxTimes(med)}
                  </span>
                  <span className="block text-[10px] text-[#7a7a7a]">{med.dosage}</span>
                </span>
              </button>
            </article>
          );
        })}
      </div>
      <RxDrawerModal open={drawerOpen} onOpenChange={onDrawerOpen} prescriptions={prescriptions} />
    </BentoPanel>
  );
}
