"use client";

import { useEffect, useState } from "react";
import type { Tables } from "@/lib/supabase/database.types";
import { useTranslations, type AdminMessageKey } from "@/lib/i18n";
import { AdminSkeleton } from "./AdminSkeleton";

type Row = Pick<
  Tables<"patient_notifications">,
  | "id" | "kind" | "status" | "skip_reason" | "patient_name" | "phone"
  | "language" | "template_name" | "scheduled_for" | "sent_at" | "created_at" | "last_error"
>;

const STATUSES = ["", "pending", "sent", "skipped", "failed", "superseded", "abandoned"];

const STATUS_LABEL_KEYS: Record<string, AdminMessageKey> = {
  pending: "admin.pages.outbox.statusPending",
  sent: "admin.pages.outbox.statusSent",
  skipped: "admin.pages.outbox.statusSkipped",
  failed: "admin.pages.outbox.statusFailed",
  superseded: "admin.pages.outbox.statusSuperseded",
  abandoned: "admin.pages.outbox.statusAbandoned",
};

const TONE: Record<string, string> = {
  sent: "text-[#15803D]",
  pending: "text-[#1D4ED8]",
  failed: "text-[#B91C1C]",
  abandoned: "text-[#B91C1C]",
};

async function fetchRows(status: string): Promise<Row[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await fetch(`/api/v1/notifications/outbox${qs}`);
  if (!res.ok) throw new Error("load failed");
  const data = (await res.json()) as { rows?: Row[] };
  return data.rows ?? [];
}

/**
 * Every message the system meant to send, and what became of it. The
 * skip_reason column is the answer to "why did this patient not hear from us".
 */
export function NotificationsOutboxTable() {
  const t = useTranslations();
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetchRows(status)
      .then((next) => {
        if (!alive) return;
        setRows(next);
        setFailed(false);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [status]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <label htmlFor="outbox-status" className="text-muted-foreground">
          {t("admin.pages.outbox.status")}
        </label>
        <select
          id="outbox-status"
          className="h-8 rounded-md border bg-transparent px-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s || "all"} value={s}>
              {s ? t(STATUS_LABEL_KEYS[s]) : t("admin.pages.outbox.statusAll")}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">{t("admin.pages.outbox.recent100")}</span>
      </div>

      {failed ? (
        <p className="text-sm text-[#B91C1C]">{t("admin.pages.outbox.loadError")}</p>
      ) : rows === null ? (
        <div aria-busy="true" className="overflow-x-auto">
          <span className="sr-only">{t("admin.pages.outbox.loadingSr")}</span>
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[130px_1.2fr_120px_1fr_1fr] gap-3 border-b py-2">
              {["w-14", "w-14", "w-10", "w-16", "w-16"].map((w, i) => (
                <AdminSkeleton key={i} className={`h-3 ${w}`} />
              ))}
            </div>
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="grid grid-cols-[130px_1.2fr_120px_1fr_1fr] items-start gap-3 border-b py-3">
                <AdminSkeleton className="h-3.5 w-24" />
                <div className="space-y-1.5">
                  <AdminSkeleton className="h-3.5 w-28" />
                  <AdminSkeleton className="h-3 w-24" />
                </div>
                <AdminSkeleton className="h-3.5 w-20" />
                <AdminSkeleton className="h-3.5 w-16" />
                <AdminSkeleton className="h-3.5 w-28" />
              </div>
            ))}
          </div>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.pages.outbox.empty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="py-2 pr-3 font-medium">{t("admin.pages.outbox.colQueued")}</th>
                <th className="py-2 pr-3 font-medium">{t("admin.pages.outbox.colPatient")}</th>
                <th className="py-2 pr-3 font-medium">{t("admin.pages.outbox.colKind")}</th>
                <th className="py-2 pr-3 font-medium">{t("admin.pages.outbox.colOutcome")}</th>
                <th className="py-2 font-medium">{t("admin.pages.outbox.colTemplate")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.id} className="align-top">
                  <td className="py-2 pr-3 whitespace-nowrap text-xs">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-3">
                    <div>{row.patient_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{row.phone}</div>
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">{row.kind}</td>
                  <td className="py-2 pr-3">
                    <span className={`font-medium ${TONE[row.status] ?? ""}`}>
                      {STATUS_LABEL_KEYS[row.status] ? t(STATUS_LABEL_KEYS[row.status]) : row.status}
                    </span>
                    {row.skip_reason ? (
                      <div className="font-mono text-xs text-muted-foreground">{row.skip_reason}</div>
                    ) : null}
                    {row.last_error ? (
                      <div className="text-xs text-[#B91C1C]">{row.last_error}</div>
                    ) : null}
                  </td>
                  <td className="py-2 font-mono text-xs">
                    {row.template_name ?? "—"}
                    {row.language ? ` (${row.language})` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
