"use client";

import { EHR, type EhrCondition } from "./ehr.types";

export function EhrConditionPill({
  toothName,
  fdi,
  active,
  metric,
  onClick,
}: {
  toothName: string;
  fdi: string | null;
  active: boolean;
  metric?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex w-full min-w-0 items-start gap-2.5 rounded-2xl border px-3 py-2.5 text-start transition"
      style={{
        background: active
          ? "color-mix(in srgb, var(--admin-primary) 10%, var(--admin-panel))"
          : EHR.card,
        borderColor: active ? "var(--admin-primary)" : EHR.border,
        boxShadow: active
          ? "inset 3px 0 0 var(--admin-primary)"
          : "none",
      }}
    >
      <span
        className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full"
        style={{
          background: active
            ? "color-mix(in srgb, var(--admin-primary) 22%, white)"
            : EHR.soft,
        }}
      >
        <span
          className="size-2 rounded-full"
          style={{
            background: active ? "var(--admin-primary)" : EHR.ink,
          }}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block text-[13px] leading-snug font-medium"
          style={{ color: EHR.ink }}
        >
          {toothName}
        </span>
        {fdi ? (
          <span
            className="mt-0.5 block text-[11px] font-medium tabular-nums"
            style={{ color: EHR.muted }}
          >
            #{fdi}
          </span>
        ) : null}
      </span>
      {metric ? (
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
          style={{
            background: active ? "var(--admin-primary)" : EHR.soft,
            color: active ? "#fff" : EHR.ink,
          }}
        >
          {metric}
        </span>
      ) : null}
    </button>
  );
}

export function EhrNoteNode({
  title,
  preview,
}: {
  title: string;
  preview: string;
}) {
  return (
    <div
      className="w-full rounded-2xl border px-3.5 py-3"
      style={{ background: EHR.card, borderColor: EHR.border }}
    >
      <p
        className="text-[10px] font-semibold tracking-[0.12em] uppercase"
        style={{ color: EHR.muted }}
      >
        {title}
      </p>
      <p className="mt-1 line-clamp-4 text-[12px] leading-snug text-[var(--admin-primary)]">
        {preview || "Empty note"}
      </p>
    </div>
  );
}

export function EhrClusterLabel({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div className="mb-2 flex items-center gap-2 px-0.5">
      <p
        className="text-[10px] font-semibold tracking-[0.14em] uppercase"
        style={{ color: EHR.muted }}
      >
        {label}
      </p>
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{ background: EHR.soft, color: EHR.ink }}
      >
        {count}
      </span>
    </div>
  );
}
