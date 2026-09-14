"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { decideTreatmentProposal } from "@/services/treatment_proposals/actions";
import type { PendingProposal } from "@/services/treatment_proposals/types";
import { formatEgp } from "@/services/deposits/receiptMessages";
import { useLocale } from "@/lib/i18n";

type PriceableDoctor = { id: string; display_name: string | null };

type Props = {
  proposals: PendingProposal[];
  doctors: PriceableDoctor[];
  onDecided: () => void;
};

export function PendingProposalsList({ proposals, doctors, onDecided }: Props) {
  const { locale } = useLocale();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function decide(id: string, decision: "accepted" | "declined") {
    setPendingId(id);
    try {
      await decideTreatmentProposal(id, decision);
      toast.success(decision === "accepted" ? "Proposal accepted" : "Proposal declined");
      onDecided();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPendingId(null);
    }
  }

  if (proposals.length === 0) return null;

  return (
    <Card className="h-full gap-3 bg-transparent p-6">
      <p className="text-sm font-medium text-[var(--admin-text)]">Pending proposals</p>
      <ul className="space-y-3">
        {proposals.map((proposal) => (
          <li key={proposal.id} className="rounded-lg border border-[var(--admin-border)] p-3">
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
              Total: {formatEgp(proposal.total, locale)}
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={pendingId === proposal.id}
                onClick={() => void decide(proposal.id, "accepted")}
              >
                Accept
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pendingId === proposal.id}
                onClick={() => void decide(proposal.id, "declined")}
              >
                Decline
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
