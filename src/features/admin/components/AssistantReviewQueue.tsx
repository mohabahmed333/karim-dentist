"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CorrectionRow } from "@/services/whatsapp_ai/corrections";
import { useTranslations } from "@/lib/i18n";
import { AdminSkeleton } from "./AdminSkeleton";

async function fetchQueue(): Promise<CorrectionRow[]> {
  const res = await fetch("/api/v1/whatsapp/ai/corrections");
  if (!res.ok) throw new Error("load failed");
  const data = (await res.json()) as { corrections?: CorrectionRow[] };
  return data.corrections ?? [];
}

/**
 * Drafts staff rewrote before sending — each one a place the assistant was
 * wrong in a way a person knew how to fix.
 */
export function AssistantReviewQueue() {
  const t = useTranslations();
  const [rows, setRows] = useState<CorrectionRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchQueue()
      .then((next) => {
        if (alive) setRows(next);
      })
      .catch(() => {
        if (alive) {
          setRows([]);
          toast.error(t("admin.pages.assistantReview.loadFailed"));
        }
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch once on mount
  }, []);

  async function act(id: string, action: "reviewed" | "promote") {
    setBusy(id);
    try {
      const res = await fetch(`/api/v1/whatsapp/ai/corrections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      setRows((prev) => (prev ?? []).filter((r) => r.id !== id));
      toast.success(
        action === "promote"
          ? t("admin.pages.assistantReview.promoted")
          : t("admin.pages.assistantReview.reviewed"),
      );
    } catch {
      toast.error(t("admin.pages.assistantReview.actionSaveFailed"));
    } finally {
      setBusy(null);
    }
  }

  if (rows === null) {
    return (
      <div aria-busy="true" className="space-y-3">
        <span className="sr-only">{t("admin.pages.assistantReview.loadingSr")}</span>
        <div className="flex items-center justify-between gap-2">
          <AdminSkeleton className="h-4 w-72" />
          <AdminSkeleton className="h-8 w-44 rounded-md" />
        </div>
        {[0, 1].map((card) => (
          <Card key={card} className="gap-3 p-4">
            <div className="flex gap-2">
              <AdminSkeleton className="h-4 w-24" />
              <AdminSkeleton className="h-4 w-20" />
              <AdminSkeleton className="h-4 w-32" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[0, 1].map((side) => (
                <div key={side} className="space-y-1">
                  <AdminSkeleton className="h-3 w-28" />
                  <AdminSkeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <AdminSkeleton className="h-8 w-28 rounded-md" />
              <AdminSkeleton className="h-8 w-48 rounded-md" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {rows.length === 0
            ? t("admin.pages.assistantReview.emptyState")
            : t("admin.pages.assistantReview.draftsCount").replace("{count}", String(rows.length))}
        </p>
        <a
          href="/api/v1/whatsapp/ai/corrections?export=1"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center rounded-md border px-3 text-sm hover:bg-muted"
        >
          {t("admin.pages.assistantReview.exportJson")}
        </a>
      </div>

      {rows.map((row) => (
        <Card key={row.id} className="gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {row.intent ? <span className="rounded border px-1.5 py-0.5 font-mono">{row.intent}</span> : null}
            {row.reason ? <span className="font-mono">{row.reason}</span> : null}
            <span>{new Date(row.created_at).toLocaleString()}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {t("admin.pages.assistantReview.assistantProposed")}
              </p>
              <p className="whitespace-pre-wrap rounded-md border border-dashed p-2 text-sm" dir="auto">
                {row.ai_text}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {t("admin.pages.assistantReview.staffSent")}
              </p>
              <p className="whitespace-pre-wrap rounded-md border p-2 text-sm" dir="auto">
                {row.sent_text}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy === row.id}
              onClick={() => void act(row.id, "reviewed")}
            >
              {t("admin.pages.assistantReview.markReviewed")}
            </Button>
            <Button size="sm" disabled={busy === row.id} onClick={() => void act(row.id, "promote")}>
              {t("admin.pages.assistantReview.addToKnowledge")}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
