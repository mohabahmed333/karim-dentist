"use client";

import type { ReactNode } from "react";
import type { BillingPaymentQueueRow } from "@/services/billing_payments/queries";
import { useTranslations } from "@/lib/i18n";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";

const STATUS: Record<string, { labelKey: AdminMessageKey; className: string }> = {
  awaiting_receipt: { labelKey: "admin.deposits.statusAwaitingReceipt", className: "border-[var(--admin-border)] text-[var(--admin-muted)]" },
  in_review: { labelKey: "admin.deposits.statusInReview", className: "border-[#FCD34D] bg-[#FFFBEB] text-[#B45309]" },
};

const money = (value: number | null) =>
  value === null ? "—" : `EGP ${new Intl.NumberFormat("en-EG", { maximumFractionDigits: 2 }).format(value)}`;

const when = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(iso))
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
 * One billing payment request, shaped around the same question deposits'
 * card answers: does this receipt pay for that bill? Modeled directly on
 * DepositReceiptCard.tsx, but without appointment fields (a bill has none).
 */
export function BillingPaymentReceiptCard({
  row,
  children,
}: {
  row: BillingPaymentQueueRow;
  children?: ReactNode;
}) {
  const t = useTranslations();
  const statusEntry = STATUS[row.status];
  const status = {
    label: statusEntry ? t(statusEntry.labelKey) : row.status,
    className: statusEntry?.className ?? "border-[var(--admin-border)] text-[var(--admin-muted)]",
  };
  const read = row.receipt?.amountEgp ?? null;
  const short = read !== null && read < row.amountEgp;

  return (
    <article className="overflow-hidden rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)]">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2">
        <span className="text-sm font-medium">{row.patientName || row.phone}</span>
        <span className="text-xs text-[var(--admin-muted)]">{row.description}</span>
        <span className={`ml-auto rounded-full border px-2 py-0.5 text-xs ${status.className}`}>{status.label}</span>
      </header>

      <div className="flex flex-wrap gap-3 border-t border-[var(--admin-border,#e5e7eb)] px-3 py-2.5">
        {row.receipt?.imageUrl ? (
          <a href={row.receipt.imageUrl} target="_blank" rel="noreferrer" className="shrink-0" title={t("admin.deposits.openReceipt")}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a vendor-hosted receipt on an arbitrary host. */}
            <img
              src={row.receipt.imageUrl}
              alt={t("admin.deposits.receiptAlt")}
              className="h-40 w-32 rounded border border-[var(--admin-border,#e5e7eb)] object-cover"
            />
          </a>
        ) : (
          <div className="flex h-40 w-32 shrink-0 items-center justify-center rounded border border-dashed border-[var(--admin-border,#e5e7eb)] text-xs text-[var(--admin-muted)]">
            {t("admin.deposits.noReceiptYet")}
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2.5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            <Field label={t("admin.deposits.asked")} value={money(row.amountEgp)} />
            <Field label={t("admin.deposits.onReceipt")} value={money(read)} warn={short} />
            <Field label={t("admin.deposits.difference")} value={read === null ? "—" : money(read - row.amountEgp)} warn={short} />
            <Field label={t("admin.deposits.reference")} value={row.receipt?.reference ?? "—"} />
            <Field label={t("admin.deposits.paidTo")} value={row.receipt?.recipientHandle ?? row.receipt?.recipientName ?? "—"} />
            <Field label={t("admin.from")} value={row.receipt?.senderName ?? "—"} />
            <Field label={t("admin.deposits.transferred")} value={when(row.receipt?.transferredAt ?? null)} />
            <Field
              label={t("admin.deposits.confidence")}
              value={row.receipt?.confidence === null || row.receipt?.confidence === undefined ? "—" : `${Math.round(row.receipt.confidence * 100)}%`}
            />
            <Field label={t("admin.deposits.whyHere")} value={row.receipt?.verdictReason || row.decisionReason || "—"} />
          </dl>

          {row.receiptCount > 1 ? (
            <p className="text-xs text-[var(--admin-muted)]">
              {t("admin.deposits.receiptsSent").replace("{count}", String(row.receiptCount))}
            </p>
          ) : null}
        </div>
      </div>

      {children}
    </article>
  );
}
