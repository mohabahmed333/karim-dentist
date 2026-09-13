"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import type { DepositQueueRow } from "@/services/deposits/queries";

const STATUS: Record<string, { label: string; className: string }> = {
  awaiting_receipt: { label: "Waiting for the patient", className: "border-[var(--admin-border)] text-[var(--admin-muted)]" },
  in_review: { label: "Waiting for you", className: "border-[#FCD34D] bg-[#FFFBEB] text-[#B45309]" },
  paid: { label: "Paid", className: "border-[#86EFAC] bg-[#F0FDF4] text-[#15803D]" },
  expired: { label: "Lapsed", className: "border-[var(--admin-border)] text-[var(--admin-muted)]" },
  rejected: { label: "Rejected", className: "border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]" },
  cancelled: { label: "Cancelled", className: "border-[var(--admin-border)] text-[var(--admin-muted)]" },
};

const money = (value: number | null) =>
  value === null ? "—" : `EGP ${new Intl.NumberFormat("en-EG", { maximumFractionDigits: 2 }).format(value)}`;

const when = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Cairo",
      }).format(new Date(iso))
    : "—";

function Field({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-[var(--admin-muted)]">{label}</dt>
      <dd className={`truncate text-sm ${warn ? "text-[#B91C1C]" : ""}`}>{value}</dd>
    </div>
  );
}

/**
 * One deposit, shaped around the only question staff have: does this receipt pay
 * for that appointment?
 *
 * So the amount asked sits beside the amount read with the difference spelled
 * out, rather than leaving someone to do arithmetic on two numbers in different
 * corners of a screen.
 */
export function DepositReceiptCard({
  row,
  children,
}: {
  row: DepositQueueRow;
  children?: ReactNode;
}) {
  const status = STATUS[row.status] ?? {
    label: row.status,
    className: "border-[var(--admin-border)] text-[var(--admin-muted)]",
  };
  const read = row.receipt?.amountEgp ?? null;
  const short = read !== null && read < row.amountAskedEgp;

  return (
    <article className="overflow-hidden rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)]">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2">
        <span className="text-sm font-medium">{row.patientName || row.phone}</span>
        <span className="text-xs text-[var(--admin-muted)]">
          {row.serviceLabel} · {when(row.startsAt)}
        </span>
        <span className={`ml-auto rounded-full border px-2 py-0.5 text-xs ${status.className}`}>
          {status.label}
        </span>
      </header>

      <div className="flex flex-wrap gap-3 border-t border-[var(--admin-border,#e5e7eb)] px-3 py-2.5">
        {row.receipt?.imageUrl ? (
          <a
            href={row.receipt.imageUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0"
            title="Open the full receipt"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a vendor-hosted
                receipt on an arbitrary host; the image optimiser would need it
                allow-listed and there is no value in optimising a screenshot. */}
            <img
              src={row.receipt.imageUrl}
              alt="Payment receipt the patient sent"
              className="h-40 w-32 rounded border border-[var(--admin-border,#e5e7eb)] object-cover"
            />
          </a>
        ) : (
          <div className="flex h-40 w-32 shrink-0 items-center justify-center rounded border border-dashed border-[var(--admin-border,#e5e7eb)] text-xs text-[var(--admin-muted)]">
            No receipt yet
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2.5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            <Field label="Asked" value={money(row.amountAskedEgp)} />
            <Field label="On the receipt" value={money(read)} warn={short} />
            <Field
              label="Difference"
              value={read === null ? "—" : money(read - row.amountAskedEgp)}
              warn={short}
            />
            <Field label="Reference" value={row.receipt?.reference ?? "—"} />
            <Field label="Paid to" value={row.receipt?.recipientHandle ?? row.receipt?.recipientName ?? "—"} />
            <Field label="From" value={row.receipt?.senderName ?? "—"} />
            <Field label="Transferred" value={when(row.receipt?.transferredAt ?? null)} />
            <Field
              label="Confidence"
              value={row.receipt?.confidence === null || row.receipt?.confidence === undefined
                ? "—"
                : `${Math.round(row.receipt.confidence * 100)}%`}
            />
            <Field
              label={row.status === "awaiting_receipt" ? "Hold expires" : "Why it is here"}
              value={
                row.status === "awaiting_receipt"
                  ? when(row.expiresAt)
                  : row.receipt?.verdictReason || row.decisionReason || "—"
              }
            />
          </dl>

          {row.receiptCount > 1 ? (
            <p className="text-xs text-[var(--admin-muted)]">
              {row.receiptCount} receipts sent for this deposit — the latest is shown.
            </p>
          ) : null}

          {row.receipt?.suspiciousText ? (
            <p className="flex items-start gap-2 rounded border border-[#FCA5A5] bg-[#FEF2F2] px-2 py-1.5 text-xs text-[#B91C1C]">
              <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              <span>
                This image contained text addressed to the assistant, which was recorded and not
                acted on: “{row.receipt.suspiciousText}”
              </span>
            </p>
          ) : null}
        </div>
      </div>

      {children}
    </article>
  );
}
