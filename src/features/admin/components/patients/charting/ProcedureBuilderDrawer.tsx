"use client";

import { useState } from "react";
import {
  phaseForCareBucket,
  type CareBucket,
  type CdtPhase,
} from "@/services/cdt";
import { SideDrawer } from "../treatments/SideDrawer";
import { CdtPresetChips } from "./CdtPresetChips";
import { ChartingSegment } from "./ChartingSegment";

type Props = {
  open: boolean;
  onClose: () => void;
  toothLabel: string | null;
  hasTooth: boolean;
  onAdd: (code: string, fee: number, phase: CdtPhase) => void;
};

export function ProcedureBuilderDrawer({
  open,
  onClose,
  toothLabel,
  hasTooth,
  onAdd,
}: Props) {
  const [bucket, setBucket] = useState<CareBucket>("planned");

  return (
    <SideDrawer open={open} title="Add procedure" onClose={onClose}>
      <div className="space-y-4 px-5 pb-5">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
            Care phase
          </p>
          <ChartingSegment
            value={bucket}
            onChange={setBucket}
            options={[
              { id: "immediate", label: "Immediate" },
              { id: "planned", label: "Planned" },
            ]}
          />
        </div>
        <CdtPresetChips
          hasTooth={hasTooth}
          toothLabel={toothLabel}
          onAdd={(code, fee) => {
            onAdd(code, fee, phaseForCareBucket(bucket));
            onClose();
          }}
        />
      </div>
    </SideDrawer>
  );
}
