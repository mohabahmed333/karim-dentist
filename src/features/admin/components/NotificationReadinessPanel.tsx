"use client";

import { AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";

export type ReadinessCheck = {
  key: string;
  status: "ok" | "missing" | "unknown";
  required: boolean;
  detail: string;
};

export type Readiness = {
  checks: ReadinessCheck[];
  canSend: boolean;
  blocking: string[];
  requiredTemplates: string[];
  queue: Record<string, number>;
};

/** Human labels; the API returns stable keys so it stays translatable later. */
const LABELS: Record<string, string> = {
  cron_secret: "CRON_SECRET",
  whatsapp_transport: "WhatsApp credentials",
  service_role: "Supabase service role key",
  templates: "Approved Meta templates",
  scheduler: "Scheduled dispatch job",
  settings_row: "Settings row",
};

const TONE: Record<ReadinessCheck["status"], string> = {
  ok: "text-[#15803D]",
  missing: "text-[#B91C1C]",
  unknown: "text-[#B45309]",
};

function Icon({ status }: { status: ReadinessCheck["status"] }) {
  const className = `size-4 shrink-0 ${TONE[status]}`;
  if (status === "ok") return <CheckCircle2 className={className} aria-hidden />;
  if (status === "unknown") return <HelpCircle className={className} aria-hidden />;
  return <AlertTriangle className={className} aria-hidden />;
}

export function NotificationReadinessPanel({ readiness }: { readiness: Readiness }) {
  const queued = Object.entries(readiness.queue).sort((a, b) => b[1] - a[1]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">What&apos;s missing</h3>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs ${
            readiness.canSend
              ? "border-[#86EFAC] bg-[#F0FDF4] text-[#15803D]"
              : "border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]"
          }`}
        >
          {readiness.canSend
            ? "Ready to send"
            : `${readiness.blocking.length} blocking`}
        </span>
      </div>

      <ul className="space-y-1.5">
        {readiness.checks.map((check) => (
          <li
            key={check.key}
            className="flex gap-2 rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)] px-3 py-2 text-sm"
          >
            <Icon status={check.status} />
            <div className="min-w-0 space-y-0.5">
              <div className="font-medium">
                {LABELS[check.key] ?? check.key}
                {!check.required ? (
                  <span className="ml-2 text-xs text-[var(--admin-muted,#6b7280)]">
                    optional
                  </span>
                ) : null}
              </div>
              <p className="text-xs leading-relaxed text-[var(--admin-muted,#6b7280)]">
                {check.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <details className="rounded-lg border border-[var(--admin-border,#e5e7eb)] px-3 py-2 text-xs">
        <summary className="cursor-pointer">
          Templates this clinic needs approved in Meta
        </summary>
        <p className="mt-2 text-[var(--admin-muted,#6b7280)]">
          Names are immutable once submitted. Two of these are misspelled and the
          reminder suffixes are swapped — that is deliberate and matches what was
          actually approved.
        </p>
        <ul className="mt-1.5 font-mono">
          {readiness.requiredTemplates.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </details>

      {queued.length > 0 ? (
        <div className="text-xs text-[var(--admin-muted,#6b7280)]">
          Queue:{" "}
          {queued.map(([key, count], i) => (
            <span key={key}>
              {i > 0 ? " · " : ""}
              <span className="font-mono">{key}</span> {count}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--admin-muted,#6b7280)]">
          Nothing queued yet. A notification appears here as soon as an
          appointment is booked.
        </p>
      )}
    </section>
  );
}
