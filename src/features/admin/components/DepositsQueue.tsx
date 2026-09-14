"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DepositQueueRow } from "@/services/deposits/queries";
import { AdminSkeleton } from "./AdminSkeleton";
import { DepositReceiptCard } from "./DepositReceiptCard";
import { useTranslations } from "@/lib/i18n";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";

const FILTERS: { key: string; labelKey: AdminMessageKey }[] = [
  { key: "in_review", labelKey: "admin.deposits.statusInReview" },
  { key: "awaiting_receipt", labelKey: "admin.deposits.statusAwaitingReceipt" },
  { key: "paid", labelKey: "admin.deposits.statusPaid" },
  { key: "", labelKey: "admin.deposits.filterAll" },
];

export function DepositsQueue() {
  const t = useTranslations();
  const [status, setStatus] = useState<string>("in_review");
  // Keyed by the filter it belongs to, so switching filters shows the skeleton
  // without a synchronous setState inside the effect.
  const [loaded, setLoaded] = useState<{ status: string; rows: DepositQueueRow[] } | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const load = useCallback(
    async (next: string) => {
      const query = next ? `?status=${next}` : "";
      const res = await fetch(`/api/v1/deposits${query}`);
      if (!res.ok) throw new Error(t("admin.deposits.loadFailed"));
      const body = (await res.json()) as { deposits: DepositQueueRow[] };
      return body.deposits;
    },
    [t],
  );

  useEffect(() => {
    let alive = true;
    void load(status)
      .then((next) => {
        if (alive) setLoaded({ status, rows: next });
      })
      .catch(() => {
        if (alive) {
          setLoaded({ status, rows: [] });
          toast.error(t("admin.deposits.loadFailed"));
        }
      });
    return () => {
      alive = false;
    };
  }, [load, status, t]);

  const rows = loaded?.status === status ? loaded.rows : null;

  async function decide(id: string, action: "confirm" | "reject") {
    setPending(id);
    try {
      const res = await fetch(`/api/v1/deposits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reasons[id] ?? "" }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? t("admin.deposits.applyFailed"));
      // Drop it from the list rather than refetching: staff work down a queue,
      // and a reordering jump loses their place.
      setLoaded((current) =>
        current ? { ...current, rows: current.rows.filter((row) => row.id !== id) } : current,
      );
      toast.success(
        action === "confirm"
          ? t("admin.deposits.confirmed")
          : t("admin.deposits.rejected"),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.deposits.applyFailed"));
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter.key || "all"}
            type="button"
            size="sm"
            variant={status === filter.key ? "default" : "outline"}
            onClick={() => setStatus(filter.key)}
          >
            {t(filter.labelKey)}
          </Button>
        ))}
      </div>

      {rows === null ? (
        <div className="space-y-2">
          <AdminSkeleton className="h-40 w-full rounded-lg" />
          <AdminSkeleton className="h-40 w-full rounded-lg" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-[var(--admin-border,#e5e7eb)] px-4 py-8 text-center text-sm text-[var(--admin-muted)]">
          {t("admin.empty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <DepositReceiptCard row={row}>
                {row.status === "in_review" || row.status === "awaiting_receipt" ? (
                  <div className="flex flex-wrap items-center gap-2 border-t border-[var(--admin-border,#e5e7eb)] px-3 py-2">
                    <Input
                      value={reasons[row.id] ?? ""}
                      placeholder={t("admin.deposits.reasonPlaceholder")}
                      className="h-8 min-w-0 flex-1"
                      onChange={(e) =>
                        setReasons((current) => ({ ...current, [row.id]: e.target.value }))
                      }
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={pending === row.id}
                      onClick={() => void decide(row.id, "confirm")}
                    >
                      {t("admin.confirm")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending === row.id}
                      onClick={() => void decide(row.id, "reject")}
                    >
                      {t("admin.deposits.reject")}
                    </Button>
                  </div>
                ) : null}
              </DepositReceiptCard>
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-start gap-2 rounded-lg border border-[#FCD34D] bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
        <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span>{t("admin.deposits.forgeryWarning")}</span>
      </p>
    </section>
  );
}
