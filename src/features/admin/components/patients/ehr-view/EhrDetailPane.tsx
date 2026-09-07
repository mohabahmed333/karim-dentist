"use client";

import type { TreatmentItem } from "@/services/patient_treatments";
import { EHR } from "./ehr.types";
import { EhrTreatmentPropBranch } from "./EhrTreatmentProps";
import { EhrImagingCard } from "./EhrImagingCard";
import { plainText } from "./ehrScene";
import type { EhrMediaPanel } from "./ehr.types";
import type { TreatmentPropNode } from "./treatmentProps";

type Props = {
  treatment: TreatmentItem;
  expanded: boolean;
  onToggle: () => void;
  propNodes: TreatmentPropNode[];
  media: EhrMediaPanel[];
};

export function EhrDetailPane({
  treatment,
  expanded,
  onToggle,
  propNodes,
  media,
}: Props) {
  const toothLabel = `${treatment.toothName}${
    treatment.toothFdi ? ` · #${treatment.toothFdi}` : ""
  }`;
  const title = treatment.aiInsight?.title?.trim() || toothLabel;
  const subtitle =
    treatment.aiInsight?.title?.trim() && toothLabel !== title
      ? toothLabel
      : plainText(treatment.lastTreatment);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <button
        type="button"
        onClick={onToggle}
        className="w-full rounded-2xl border p-4 text-start"
        style={{ background: EHR.card, borderColor: EHR.ink }}
      >
        <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
          <Chip ink>{treatment.status}</Chip>
          <Chip>{treatment.severity}</Chip>
          {treatment.cdtCode ? <Chip muted>{treatment.cdtCode}</Chip> : null}
        </div>
        <p className="text-[15px] leading-snug font-semibold tracking-tight text-[var(--admin-primary)]">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-1 text-[12px] leading-snug" style={{ color: EHR.muted }}>
            {subtitle}
          </p>
        ) : null}
        <p className="mt-2.5 text-[10px]" style={{ color: EHR.muted }}>
          {expanded ? "Collapse details" : "Show progress, details, attachments"}
        </p>
      </button>
      {expanded ? <EhrTreatmentPropBranch nodes={propNodes} /> : null}
      {media.length > 0 ? <EhrImagingCard panels={media} /> : null}
    </div>
  );
}

function Chip({
  children,
  ink,
  muted,
}: {
  children: React.ReactNode;
  ink?: boolean;
  muted?: boolean;
}) {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize tabular-nums"
      style={{
        background: ink ? EHR.ink : EHR.soft,
        color: ink ? "#fff" : muted ? EHR.muted : EHR.ink,
      }}
    >
      {children}
    </span>
  );
}
