"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The rail-and-card timeline the patient record uses, for treatments on a
 * tooth and for the patient's visits.
 *
 * Both were drawn separately first and drifted — different dot sizes, a line
 * that ran past the last entry in one and not the other. One component keeps
 * them identical, and keeps the rail's geometry (where the dot sits relative
 * to the card, where the line stops) in a single place.
 */
export function RecordTimeline({ children }: { children: ReactNode }) {
  return <ol className="space-y-3">{children}</ol>;
}

type EntryProps = {
  /** False on the final entry, so the connecting line stops rather than trails. */
  connected: boolean;
  /** Accent the dot — an in-progress or upcoming entry, say. */
  accent?: boolean;
  children: ReactNode;
};

export function RecordTimelineEntry({
  connected,
  accent = false,
  children,
}: EntryProps) {
  return (
    <li className="flex gap-3">
      <div
        aria-hidden
        className="relative flex w-3 shrink-0 justify-center pt-8"
      >
        <span
          className={cn(
            "size-2.5 shrink-0 rounded-full",
            accent
              ? "bg-[var(--admin-primary)]"
              : "bg-[var(--admin-muted)]",
          )}
        />
        {connected ? (
          <span className="absolute top-11 bottom-[-1.25rem] w-px bg-[var(--admin-border)]" />
        ) : null}
      </div>
      <article className="min-w-0 flex-1 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
        {children}
      </article>
    </li>
  );
}

/** A labelled column inside an entry — CONDITION, TREATMENT, DENTIST … */
export function RecordTimelineField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--admin-muted)]">
        {label}
      </p>
      <p className="truncate text-sm text-[var(--admin-text)]">{value}</p>
    </div>
  );
}

/** The month-over-day block that opens each entry. */
export function RecordTimelineDate({
  month,
  day,
}: {
  month: string;
  day: string;
}) {
  return (
    <div className="shrink-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--admin-muted)]">
        {month}
      </p>
      <p className="text-xl font-semibold tabular-nums text-[var(--admin-text)]">
        {day}
      </p>
    </div>
  );
}
