"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BillingPaymentQueueRow } from "@/services/billing_payments/queries";
import { decideBillingPayment } from "@/services/billing_payments/actions";
import { BillingPaymentReceiptCard } from "./BillingPaymentReceiptCard";
import { useTranslations } from "@/lib/i18n";

type Props = {
  rows: BillingPaymentQueueRow[];
};

export function BillingPaymentReviewList({ rows }: Props) {
  const router = useRouter();
  const t = useTranslations();
  const [pending, setPending] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  async function decide(id: string, decision: "confirm" | "reject") {
    setPending(id);
    try {
      await decideBillingPayment(id, decision, reasons[id] ?? "");
      toast.success(decision === "confirm" ? t("admin.deposits.confirmed") : t("admin.deposits.rejected"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.deposits.applyFailed"));
    } finally {
      setPending(null);
    }
  }

  if (rows.length === 0) return null;

  return (
    <section className="space-y-3">
      <p className="text-sm font-medium text-[var(--admin-text)]">{t("admin.billing.awaitingPayment")}</p>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id}>
            <BillingPaymentReceiptCard row={row}>
              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--admin-border,#e5e7eb)] px-3 py-2">
                <Input
                  value={reasons[row.id] ?? ""}
                  placeholder={t("admin.deposits.reasonPlaceholder")}
                  className="h-8 min-w-0 flex-1"
                  onChange={(e) => setReasons((current) => ({ ...current, [row.id]: e.target.value }))}
                />
                <Button type="button" size="sm" disabled={pending === row.id} onClick={() => void decide(row.id, "confirm")}>
                  {t("admin.confirm")}
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={pending === row.id} onClick={() => void decide(row.id, "reject")}>
                  {t("admin.deposits.reject")}
                </Button>
              </div>
            </BillingPaymentReceiptCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
