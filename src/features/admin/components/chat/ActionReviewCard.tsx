"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { ActionDiff, ProposedAction } from "@/services/admin_ai";
import { actionKindLabel } from "@/services/admin_ai/actionKindLabels";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "@/lib/i18n";
import { diffFieldLines } from "./reviewCardFormat";

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

/** Minutes until expiry, or null once it's past (the server enforces this either way). */
function minutesLeft(expiresAt: string | undefined, now: Date): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now.getTime();
  return ms > 0 ? Math.ceil(ms / 60_000) : null;
}

export function ActionReviewCard({
  review,
  disabled,
  onResolved,
  localOnly = false,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [busy, setBusy] = useState(false);
  const minutes = minutesLeft(review.expiresAt, new Date());
  const expired = Boolean(review.expiresAt) && minutes === null;
  const valueLabels = {
    yes: t("admin.review.yes"),
    no: t("admin.review.no"),
    empty: "—",
  };

  async function confirm() {
    setBusy(true);
    try {
      if (localOnly) {
        toast.success(t("admin.review.applied"));
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
      if (!res.ok) throw new Error(body.error ?? t("admin.review.confirmFailed"));
      const failed = (body.outcomes ?? []).filter((o) => !o.ok);
      if (failed.length) {
        toast.error(failed[0]?.message ?? t("admin.review.someFailed"));
        onResolved(false);
      } else {
        toast.success(t("admin.review.applied"));
        onResolved(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.review.confirmFailed"));
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
      toast.message(t("admin.review.cancelled"));
      onResolved(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.review.cancelFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-[#E8EAED] bg-[#FAFBFC] p-3 text-[12px]" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-semibold text-[var(--admin-text)]">{t("admin.review.title")}</p>
        {minutes !== null ? (
          <span className="shrink-0 text-[10px] text-[var(--admin-muted)]">
            {t("admin.review.expiresIn").replace("{minutes}", String(minutes))}
          </span>
        ) : null}
      </div>
      {review.summary ? (
        <p className="text-[var(--admin-muted)]">{review.summary}</p>
      ) : null}
      {expired ? (
        <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">
          {t("admin.review.expired")}
        </p>
      ) : null}
      <ul className="max-h-56 space-y-2 overflow-y-auto">
        {review.diffs.map((diff) => {
          const fields = diffFieldLines(diff, valueLabels);
          return (
            <li
              key={diff.actionId}
              className="rounded-lg border border-[#EEF0F2] bg-white px-2.5 py-2"
            >
              <p className="font-medium">{actionKindLabel(diff.kind, locale)}</p>
              <p className="text-[11px] text-[var(--admin-muted)]">{diff.target}</p>
              {fields.length ? (
                <ul className="mt-1.5 space-y-1">
                  {fields.map((f) => (
                    <li key={f.field} className="text-[11px] text-[var(--admin-text)]">
                      <span className="text-[var(--admin-muted)]">{f.field}: </span>
                      <span className="text-[var(--admin-muted)] line-through">{f.before}</span>
                      {" → "}
                      <span className="font-medium">{f.after}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {diff.warnings?.length ? (
                <p className="mt-1 text-[11px] text-amber-700">
                  {diff.warnings.join(" · ")}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          data-showreel-action="clinical-review-apply"
          data-showreel-assist-confirm=""
          data-showreel-review-confirm=""
          disabled={disabled || busy || expired}
          onClick={() => void confirm()}
        >
          {t("admin.review.confirm")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || busy}
          onClick={() => void cancel()}
        >
          {t("admin.review.cancel")}
        </Button>
      </div>
    </div>
  );
}
