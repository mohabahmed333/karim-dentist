"use client";

import { SlidersHorizontal } from "lucide-react";
import { BentoMenu } from "./BentoMenu";
import { BentoPanel } from "./BentoPanel";
import { labHeadline } from "./bento-format";
import {
  LAB_PIPELINE,
  LAB_VIEW_LABELS,
  labPipelineStage,
  type LabViewFilter,
} from "@/services/dental_chart/bento";
import type { LabOrder } from "@/services/dental_chart";

type Props = {
  labs: LabOrder[];
  filter: LabViewFilter;
  onFilter: (filter: LabViewFilter) => void;
};

export function LabsRail({ labs, filter, onFilter }: Props) {
  const lab = labs[0];
  const options = (Object.keys(LAB_VIEW_LABELS) as LabViewFilter[]).map((value) => ({
    value,
    label: LAB_VIEW_LABELS[value],
  }));
  const stage = lab ? labPipelineStage(lab.progressPercent) : 0;

  return (
    <BentoPanel
      title="Dental Labs"
      actions={
        <BentoMenu
          label="In-Progress"
          value={filter}
          options={options}
          onChange={onFilter}
        />
      }
    >
      {lab ? (
        <div className="flex items-end justify-between gap-3 px-1 py-2">
          <div>
            <p className="text-[13px] font-medium text-[#111111]">{labHeadline(lab)}</p>
            <p className="mt-1 text-[12px] text-[#7a7a7a]">{lab.progressPercent}% Complete</p>
            <p className="mt-1 text-[10px] text-[#7a7a7a]">{LAB_PIPELINE[stage]?.label}</p>
          </div>
          <div className="flex items-end gap-1.5 pb-0.5">
            {LAB_PIPELINE.map((step, index) => (
              <span
                key={step.label}
                title={step.label}
                className={`rounded-full ${step.dot} ${index === stage ? "ring-2 ring-[#E2F163]" : ""}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="px-1 py-2 text-[12px] text-[#7a7a7a]">No lab orders in this view</p>
      )}
    </BentoPanel>
  );
}
