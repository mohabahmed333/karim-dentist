"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocale, useTranslations } from "@/lib/i18n";
import { TRACKED_TABLES } from "@/services/system_log/revertPolicy";
import type { SystemActionOperation, SystemActionRow } from "@/services/system_log/listActions";
import { diffFieldLines } from "../chat/reviewCardFormat";
import { AdminSkeleton } from "../AdminSkeleton";
import { useCursorLog, type CursorPage } from "../../hooks/useCursorLog";

const OPERATIONS: SystemActionOperation[] = ["insert", "update", "delete"];

async function fetchLog(
  table: string,
  operation: string,
  cursor: string | null,
): Promise<CursorPage<SystemActionRow>> {
  const params = new URLSearchParams();
  if (table) params.set("table", table);
  if (operation) params.set("operation", operation);
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`/api/v1/admin/system-log?${params.toString()}`);
  if (!res.ok) throw new Error("load failed");
  return (await res.json()) as CursorPage<SystemActionRow>;
}

export function SystemActionLog({ canRevert }: { canRevert: boolean }) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [table, setTable] = useState("");
  const [operation, setOperation] = useState("");
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [revertedIds, setRevertedIds] = useState<Set<string>>(new Set());

  const filterKey = `${table}:${operation}`;
  const { rows, nextCursor, loadingMore, loadMore } = useCursorLog<SystemActionRow>(
    filterKey,
    (cursor) => fetchLog(table, operation, cursor),
    () => toast.error(t("admin.systemLog.loadError")),
  );

  async function revert(id: string) {
    if (!window.confirm(t("admin.systemLog.confirmRevert"))) return;
    setRevertingId(id);
    try {
      const res = await fetch("/api/v1/admin/system-log/revert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId: id }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(body.error ?? t("admin.systemLog.revertFailed"));
      setRevertedIds((prev) => new Set(prev).add(id));
      toast.success(t("admin.systemLog.reverted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.systemLog.revertFailed"));
    } finally {
      setRevertingId(null);
    }
  }

  return (
    <div className="space-y-3" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-wrap gap-2">
        <select
          className="h-8 rounded-md border bg-transparent px-2 text-sm"
          value={table}
          onChange={(e) => setTable(e.target.value)}
        >
          <option value="">{t("admin.systemLog.allTables")}</option>
          {TRACKED_TABLES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          className="h-8 rounded-md border bg-transparent px-2 text-sm"
          value={operation}
          onChange={(e) => setOperation(e.target.value)}
        >
          <option value="">{t("admin.systemLog.allOperations")}</option>
          {OPERATIONS.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      </div>

      {rows === null ? (
        <div aria-busy="true" className="space-y-3">
          <span className="sr-only">{t("admin.systemLog.loading")}</span>
          {[0, 1, 2].map((card) => (
            <Card key={card} className="gap-2 p-4">
              <AdminSkeleton className="h-4 w-56" />
              <AdminSkeleton className="h-16 w-full" />
            </Card>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.systemLog.empty")}</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const fields = diffFieldLines({ before: row.before ?? {}, after: row.after ?? {} });
            const reverted = Boolean(row.reverted_at) || revertedIds.has(row.id);
            return (
              <Card key={row.id} className="gap-3 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded border px-1.5 py-0.5 font-mono">{row.table_name}</span>
                  <span className="rounded border px-1.5 py-0.5 font-mono">{row.operation}</span>
                  <span className="font-mono">{row.row_id}</span>
                  <span>{new Date(row.created_at).toLocaleString(locale === "ar" ? "ar" : "en")}</span>
                  {reverted ? <Badge variant="secondary">{t("admin.systemLog.revertedBadge")}</Badge> : null}
                </div>

                {fields.length ? (
                  <ul className="space-y-1 text-xs">
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

                {canRevert && row.revertible && !reverted ? (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={revertingId === row.id}
                      onClick={() => void revert(row.id)}
                    >
                      {t("admin.systemLog.revert")}
                    </Button>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      {nextCursor ? (
        <div className="flex justify-center pt-2">
          <Button type="button" size="sm" variant="outline" disabled={loadingMore} onClick={() => void loadMore()}>
            {t("admin.systemLog.loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
