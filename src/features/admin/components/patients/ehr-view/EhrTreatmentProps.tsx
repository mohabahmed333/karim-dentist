"use client";

import { EHR } from "./ehr.types";
import { EhrAttachmentNode } from "./EhrAttachmentNode";
import type { TreatmentPropNode } from "./treatmentProps";

const shell = "min-w-0 rounded-2xl border px-3.5 py-3";

export function EhrProgressNode({
  percent,
  status,
}: {
  percent: number;
  status: string;
}) {
  return (
    <div className={shell} style={{ background: EHR.card, borderColor: EHR.border }}>
      <div className="flex items-center justify-between gap-2">
        <p
          className="text-[10px] font-semibold tracking-[0.12em] uppercase"
          style={{ color: EHR.muted }}
        >
          Progress
        </p>
        <span className="text-[10px] font-semibold capitalize text-[var(--admin-primary)]">
          {status}
        </span>
      </div>
      <div
        className="mt-2.5 h-1.5 overflow-hidden rounded-full"
        style={{ background: "rgba(17,17,17,0.08)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${percent}%`, background: EHR.ink }}
        />
      </div>
      <p className="mt-1.5 text-[13px] font-semibold tabular-nums text-[var(--admin-primary)]">
        {percent}%
      </p>
    </div>
  );
}

export function EhrPropNode({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  meta?: string;
}) {
  return (
    <div className={shell} style={{ background: EHR.card, borderColor: EHR.border }}>
      <p
        className="text-[10px] font-semibold tracking-[0.12em] uppercase"
        style={{ color: EHR.muted }}
      >
        {label}
      </p>
      <p className="mt-1.5 text-[12px] leading-snug font-medium text-[var(--admin-primary)]">
        {value}
      </p>
      {meta ? (
        <p className="mt-1 text-[10px] capitalize" style={{ color: EHR.muted }}>
          {meta}
        </p>
      ) : null}
    </div>
  );
}

export function EhrTreatmentPropBranch({
  nodes,
}: {
  nodes: TreatmentPropNode[];
}) {
  const attachments = nodes.filter((n) => n.kind === "attachment");
  const rest = nodes.filter((n) => n.kind !== "attachment");

  return (
    <div className="flex w-full flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        {rest.map((node) =>
          node.kind === "progress" ? (
            <EhrProgressNode
              key={node.id}
              percent={node.progress ?? 0}
              status={node.meta ?? ""}
            />
          ) : (
            <EhrPropNode
              key={node.id}
              label={node.label}
              value={node.value}
              meta={node.meta}
            />
          ),
        )}
      </div>
      {attachments.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {attachments.map((node, i) => (
            <EhrAttachmentNode
              key={node.id}
              label={node.label}
              fileName={node.value}
              url={node.url ?? "#"}
              index={i + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
