"use client";

import { Card } from "@/components/ui/card";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import type { LedgerEntryWithBalance } from "@/services/patient_billing/types";
import { formatEgp } from "@/services/deposits/receiptMessages";
import { useLocale } from "@/lib/i18n";

type Props = {
  displayName: string;
  entries: LedgerEntryWithBalance[];
  balance: number;
};

export function PatientBillingView({ displayName, entries, balance }: Props) {
  const { locale } = useLocale();

  return (
    <AdminPageMotion className="max-w-3xl space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.billing.patientTitle"
        descriptionKey="admin.billing.patientDescription"
      />

      <Card className="gap-2 bg-transparent p-6">
        <p className="text-sm text-[var(--admin-muted)]">{displayName}</p>
        <p className={`text-2xl font-semibold ${balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
          {formatEgp(Math.abs(balance), locale)}
          {balance > 0 ? " owed" : balance < 0 ? " credit" : ""}
        </p>
      </Card>

      <Card className="gap-0 bg-transparent p-0">
        {entries.length === 0 ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">No billing activity yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--admin-border)]">
            {[...entries].reverse().map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--admin-text)]">{entry.description}</p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    {new Date(entry.date).toLocaleDateString()} · {entry.source}
                  </p>
                </div>
                <div className="shrink-0 text-end">
                  <p className={entry.kind === "charge" ? "text-red-600" : "text-emerald-600"}>
                    {entry.kind === "charge" ? "+" : "−"}
                    {formatEgp(entry.amount, locale)}
                  </p>
                  <p className="text-xs text-[var(--admin-muted)]">Balance: {formatEgp(entry.balanceAfter, locale)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AdminPageMotion>
  );
}
