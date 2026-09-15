"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PendingProposalWithPatient } from "@/services/treatment_proposals/queries";
import { settleTreatmentProposal, decideTreatmentProposal } from "@/services/treatment_proposals/actions";
import { formatEgp } from "@/services/deposits/receiptMessages";
import { useLocale, useTranslations } from "@/lib/i18n";

type PriceableDoctor = { id: string; display_name: string | null };

type Props = {
  proposals: PendingProposalWithPatient[];
  doctors: PriceableDoctor[];
};

export function PendingBillingRequestsList({ proposals, doctors }: Props) {
  const router = useRouter();
  const { locale } = useLocale();
  const t = useTranslations();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function settle(id: string, method: "cash" | "whatsapp_request") {
    setPendingId(id);
    try {
      const result = await settleTreatmentProposal(id, method);
      if (!result.ok) throw new Error(result.error);
      toast.success(method === "cash" ? t("admin.billing.cashCollected") : t("admin.billing.whatsappRequested"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.deposits.applyFailed"));
    } finally {
      setPendingId(null);
    }
  }

  async function decline(id: string) {
    setPendingId(id);
    try {
      await decideTreatmentProposal(id, "declined");
      toast.success(t("admin.billing.requestDeclined"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.deposits.applyFailed"));
    } finally {
      setPendingId(null);
    }
  }

  if (proposals.length === 0) return null;

  return (
    <Card className="max-w-3xl gap-3 bg-transparent p-6">
      <p className="text-sm font-medium text-[var(--admin-text)]">{t("admin.billing.pendingRequests")}</p>
      <ul className="space-y-3">
        {proposals.map((proposal) => (
          <li key={proposal.id} className="rounded-lg border border-[var(--admin-border)] p-3">
            <p className="text-sm font-medium text-[var(--admin-text)]">{proposal.displayName}</p>
            <p className="text-xs text-[var(--admin-muted)]">
              {doctors.find((d) => d.id === proposal.doctorId)?.display_name ?? "Doctor"} ·{" "}
              {new Date(proposal.createdAt).toLocaleDateString()}
            </p>
            <ul className="mt-1 space-y-0.5 text-sm">
              {proposal.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.description}</span>
                  <span>{formatEgp(item.amountEgp, locale)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-sm font-semibold text-[var(--admin-text)]">
              {t("admin.billing.total")}: {formatEgp(proposal.total, locale)}
            </p>
            {proposal.note ? (
              <p className="mt-1 text-xs italic text-[var(--admin-muted)]">
                {t("admin.billing.noteLabel")}: {proposal.note}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={pendingId === proposal.id} onClick={() => void settle(proposal.id, "cash")}>
                {t("admin.billing.collectCash")}
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={pendingId === proposal.id} onClick={() => void settle(proposal.id, "whatsapp_request")}>
                {t("admin.billing.requestWhatsapp")}
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={pendingId === proposal.id} onClick={() => void decline(proposal.id)}>
                {t("admin.deposits.reject")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
