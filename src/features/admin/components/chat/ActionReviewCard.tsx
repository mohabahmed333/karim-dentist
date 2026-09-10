"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { ActionDiff, ProposedAction } from "@/services/admin_ai";
import { Button } from "@/components/ui/button";

export type ProposalReviewState = {
  proposalId: string;
  summary: string;
  diffs: ActionDiff[];
  actions: ProposedAction[];
  expiresAt?: string;
};

type Props = {
  review: ProposalReviewState;
  disabled?: boolean;
  onResolved: (ok: boolean) => void;
  /** Showreel/offline: skip confirm API and resolve locally. */
  localOnly?: boolean;
};

export function ActionReviewCard({
  review,
  disabled,
  onResolved,
  localOnly = false,
}: Props) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      if (localOnly) {
        toast.success("Changes applied");
        onResolved(true);
        return;
      }
      const res = await fetch("/api/v1/ai/admin-actions/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId: review.proposalId }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
        outcomes?: { ok: boolean; message?: string }[];
      };
      if (!res.ok) throw new Error(body.error ?? "Confirm failed");
      const failed = (body.outcomes ?? []).filter((o) => !o.ok);
      if (failed.length) {
        toast.error(failed[0]?.message ?? "Some actions failed");
        onResolved(false);
      } else {
        toast.success("Changes applied");
        onResolved(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Confirm failed");
      onResolved(false);
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    try {
      if (!localOnly) {
        await fetch("/api/v1/ai/admin-actions/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proposalId: review.proposalId }),
        });
      }
      toast.message("Proposal cancelled");
      onResolved(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-[#E8EAED] bg-[#FAFBFC] p-3 text-[12px]">
      <p className="font-semibold text-[var(--admin-text)]">
        Review before saving
      </p>
      {review.summary ? (
        <p className="text-[var(--admin-muted)]">{review.summary}</p>
      ) : null}
      <ul className="max-h-40 space-y-2 overflow-y-auto">
        {review.diffs.map((diff) => (
          <li
            key={diff.actionId}
            className="rounded-lg border border-[#EEF0F2] bg-white px-2.5 py-2"
          >
            <p className="font-medium">{diff.kind}</p>
            <p className="text-[11px] text-[var(--admin-muted)]">{diff.target}</p>
            {diff.warnings?.length ? (
              <p className="mt-1 text-[11px] text-amber-700">
                {diff.warnings.join(" · ")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          data-showreel-action="clinical-review-apply"
          data-showreel-assist-confirm=""
          data-showreel-review-confirm=""
          disabled={disabled || busy}
          onClick={() => void confirm()}
        >
          Confirm
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || busy}
          onClick={() => void cancel()}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
