"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocale, useTranslations, type AdminMessageKey } from "@/lib/i18n";
import { actionKindLabel } from "@/services/admin_ai/actionKindLabels";
import type { ProposalStatus } from "@/services/admin_ai/schemas";
import type { ProposalLogRow } from "@/services/admin_ai/listProposals";
import { diffFieldLines } from "../chat/reviewCardFormat";
import { AdminSkeleton } from "../AdminSkeleton";

const STATUS_FILTERS: (ProposalStatus | "all")[] = [
  "all",
  "pending",
  "confirmed",
  "cancelled",
  "expired",
  "failed",
];

const STATUS_BADGE_VARIANT: Record<ProposalStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "default",
  cancelled: "secondary",
  expired: "secondary",
  failed: "destructive",
};

const STATUS_LABEL_KEY: Record<ProposalStatus | "all", AdminMessageKey> = {
  all: "admin.aiActions.status.all",
  pending: "admin.aiActions.status.pending",
  confirmed: "admin.aiActions.status.confirmed",
  cancelled: "admin.aiActions.status.cancelled",
  expired: "admin.aiActions.status.expired",
  failed: "admin.aiActions.status.failed",
};

const OUTCOME_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  proposed: "outline",
  confirmed: "default",
  cancelled: "secondary",
  failed: "destructive",
  stale: "secondary",
};

const OUTCOME_LABEL_KEY: Record<string, AdminMessageKey> = {
  proposed: "admin.aiActions.outcome.proposed",
  confirmed: "admin.aiActions.outcome.confirmed",
  cancelled: "admin.aiActions.outcome.cancelled",
  failed: "admin.aiActions.outcome.failed",
  stale: "admin.aiActions.outcome.stale",
};

async function fetchLog(
  status: ProposalStatus | "all",
  cursor: string | null,
): Promise<{ rows: ProposalLogRow[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`/api/v1/ai/admin-actions/log?${params.toString()}`);
  if (!res.ok) throw new Error("load failed");
  return (await res.json()) as { rows: ProposalLogRow[]; nextCursor: string | null };
}

type LoadedPage = {
  status: ProposalStatus | "all";
  rows: ProposalLogRow[];
  nextCursor: string | null;
};

export function AiActionsLog() {
  const t = useTranslations();
  const { locale } = useLocale();
  const [status, setStatus] = useState<ProposalStatus | "all">("all");
  // `null`, or a page whose `status` doesn't match the current filter, both
  // read as "loading" — this is what keeps a synchronous setRows(null) out of
  // the effect below (setState inside an effect body triggers cascading
  // renders the React lint rule flags).
  const [page, setPage] = useState<LoadedPage | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetchLog(status, null)
      .then((result) => {
        if (alive) setPage({ status, rows: result.rows, nextCursor: result.nextCursor });
      })
      .catch(() => {
        if (alive) {
          setPage({ status, rows: [], nextCursor: null });
          toast.error(t("admin.aiActions.loadError"));
        }
      });
    return () => {
      alive = false;
    };
  }, [status, t]);

  const rows = page && page.status === status ? page.rows : null;
  const nextCursor = page && page.status === status ? page.nextCursor : null;

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const result = await fetchLog(status, nextCursor);
      setPage((prev) =>
        prev && prev.status === status
          ? { status, rows: [...prev.rows, ...result.rows], nextCursor: result.nextCursor }
          : prev,
      );
    } catch {
      toast.error(t("admin.aiActions.loadError"));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="space-y-3" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={status === option ? "default" : "outline"}
            onClick={() => setStatus(option)}
          >
            {t(STATUS_LABEL_KEY[option])}
          </Button>
        ))}
      </div>

      {rows === null ? (
        <div aria-busy="true" className="space-y-3">
          <span className="sr-only">{t("admin.aiActions.loading")}</span>
          {[0, 1, 2].map((card) => (
            <Card key={card} className="gap-2 p-4">
              <AdminSkeleton className="h-4 w-56" />
              <AdminSkeleton className="h-16 w-full" />
            </Card>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.aiActions.empty")}</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <ProposalCard key={row.id} row={row} locale={locale} t={t} />
          ))}
        </div>
      )}

      {nextCursor ? (
        <div className="flex justify-center pt-2">
          <Button type="button" size="sm" variant="outline" disabled={loadingMore} onClick={() => void loadMore()}>
            {t("admin.aiActions.loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ProposalCard({
  row,
  locale,
  t,
}: {
  row: ProposalLogRow;
  locale: "en" | "ar";
  t: (key: AdminMessageKey) => string;
}) {
  return (
    <Card className="gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant={STATUS_BADGE_VARIANT[row.status]}>{t(STATUS_LABEL_KEY[row.status])}</Badge>
        <span className="font-mono">{row.source}</span>
        {row.patient_key ? <span className="font-mono">{row.patient_key}</span> : null}
        <span>{new Date(row.created_at).toLocaleString(locale === "ar" ? "ar" : "en")}</span>
      </div>

      {row.summary ? (
        <p className="text-sm text-[var(--admin-text)]" dir="auto">
          {row.summary}
        </p>
      ) : null}

      {row.diffs.length ? (
        <ul className="space-y-2">
          {row.diffs.map((diff) => {
            const fields = diffFieldLines(diff);
            return (
              <li key={diff.actionId} className="rounded-lg border border-[#EEF0F2] bg-[#FAFBFC] px-2.5 py-2 text-xs">
                <p className="font-medium">{actionKindLabel(diff.kind, locale)}</p>
                <p className="text-[11px] text-muted-foreground">{diff.target}</p>
                {fields.length ? (
                  <ul className="mt-1.5 space-y-1">
                    {fields.map((f) => (
                      <li key={f.field}>
                        <span className="text-muted-foreground">{f.field}: </span>
                        <span className="text-muted-foreground line-through">{f.before}</span>
                        {" → "}
                        <span className="font-medium">{f.after}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {row.auditEvents.length ? (
        <div className="flex flex-wrap gap-1.5">
          {row.auditEvents.map((event) => (
            <Badge key={event.id} variant={OUTCOME_BADGE_VARIANT[event.outcome] ?? "outline"} title={event.error_message ?? undefined}>
              {actionKindLabel(event.action_kind, locale)}:{" "}
              {OUTCOME_LABEL_KEY[event.outcome] ? t(OUTCOME_LABEL_KEY[event.outcome]) : event.outcome}
            </Badge>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
