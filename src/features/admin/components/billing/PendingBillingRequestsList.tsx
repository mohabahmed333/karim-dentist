"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

  const heading = (
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="text-sm font-medium text-[var(--admin-text)]">
        {t("admin.billing.pendingRequests")}
      </h2>
      {proposals.length > 0 ? (
        <span className="rounded-full bg-[var(--admin-primary)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white">
          {proposals.length}
        </span>
      ) : null}
    </div>
  );

  // Rendering nothing made an empty queue and a broken one look identical —
  // worth a line of text now that the front desk is meant to watch this.
  if (proposals.length === 0) {
    return (
      <section className="space-y-3">
        {heading}
        <p className="rounded-2xl border border-dashed border-[var(--admin-border)] px-4 py-10 text-center text-sm text-[var(--admin-muted)]">
          {t("admin.billing.noPendingRequests")}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {heading}
      {/* A queue is read across, not down: at 3xl a shift's worth of bills is
          one glance instead of a column of cards with the page empty beside
          it. Cards are flex so the actions line up however tall the items run. */}
      <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {proposals.map((proposal) => {
          const busy = pendingId === proposal.id;
          const doctor =
            doctors.find((d) => d.id === proposal.doctorId)?.display_name ??
            t("admin.billing.doctorFallback");

          return (
            <li
              key={proposal.id}
              className="flex flex-col rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--admin-text)]">
                    {proposal.displayName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[var(--admin-muted)]">
                    {doctor} · {new Date(proposal.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB")}
                  </p>
                </div>
                <p className="shrink-0 text-lg font-semibold tabular-nums tracking-tight text-[var(--admin-text)]">
                  {formatEgp(proposal.total, locale)}
                </p>
              </div>

              <ul className="mt-3 space-y-1 border-t border-[var(--admin-border)] pt-3 text-sm">
                {proposal.items.map((item) => (
                  <li key={item.id} className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-[var(--admin-text)]">
                      {item.description}
                    </span>
                    <span className="shrink-0 tabular-nums text-[var(--admin-muted)]">
                      {formatEgp(item.amountEgp, locale)}
                    </span>
                  </li>
                ))}
              </ul>

              {proposal.note ? (
                <p className="mt-3 border-s-2 border-[var(--admin-border)] ps-2 text-xs text-[var(--admin-muted)]">
                  {proposal.note}
                </p>
              ) : null}

              {/* mt-auto: the action row sits on the card floor, so every card
                  in the row presents its buttons at the same height. */}
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() => void settle(proposal.id, "cash")}
                >
                  {t("admin.billing.collectCash")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void settle(proposal.id, "whatsapp_request")}
                >
                  {t("admin.billing.requestWhatsapp")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void decline(proposal.id)}
                >
                  {t("admin.deposits.reject")}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
