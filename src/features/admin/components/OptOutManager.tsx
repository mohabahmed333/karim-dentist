"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Tables } from "@/lib/supabase/database.types";
import { AdminSkeleton } from "./AdminSkeleton";
import { useTranslations } from "@/lib/i18n";

type OptOut = Pick<Tables<"patient_notification_optouts">, "phone_suffix" | "phone" | "reason" | "created_at">;

async function fetchOptOuts(): Promise<OptOut[]> {
  const res = await fetch("/api/v1/notifications/optouts");
  if (!res.ok) throw new Error("load failed");
  const data = (await res.json()) as { optouts?: OptOut[] };
  return data.optouts ?? [];
}

/**
 * Numbers the clinic must not message. Patients texting STOP or إيقاف are added
 * automatically; staff can add someone who asked on the phone.
 */
export function OptOutManager() {
  const t = useTranslations();
  const [rows, setRows] = useState<OptOut[] | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetchOptOuts()
      .then((next) => {
        if (alive) setRows(next);
      })
      .catch(() => {
        if (alive) setRows([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    setPending(true);
    try {
      const res = await fetch("/api/v1/notifications/optouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: String(form.get("phone") ?? ""),
          reason: String(form.get("reason") ?? "") || undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error ?? t("admin.optOut.addFailed"));
        return;
      }
      formEl.reset();
      setRows(await fetchOptOuts());
      toast.success(t("admin.optOut.added"));
    } finally {
      setPending(false);
    }
  }

  async function onRemove(suffix: string) {
    const res = await fetch(`/api/v1/notifications/optouts/${suffix}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(t("admin.optOut.removeFailed"));
      return;
    }
    setRows((prev) => (prev ?? []).filter((r) => r.phone_suffix !== suffix));
    toast.success(t("admin.optOut.removed"));
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium">{t("admin.optOut.title")}</h2>
      <form className="flex flex-wrap gap-2" onSubmit={(e) => void onAdd(e)}>
        <Input name="phone" required placeholder={t("admin.optOut.phonePlaceholder")} className="w-48" />
        <Input name="reason" placeholder={t("admin.optOut.reasonPlaceholder")} className="w-56" />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? t("admin.optOut.adding") : t("admin.optOut.submit")}
        </Button>
      </form>

      {rows === null ? (
        <div aria-busy="true" className="divide-y">
          <span className="sr-only">{t("admin.optOut.loading")}</span>
          {["w-36", "w-32"].map((w) => (
            <div key={w} className="flex items-center justify-between gap-3 py-2">
              <div className="space-y-1.5">
                <AdminSkeleton className={`h-3.5 ${w}`} />
                <AdminSkeleton className="h-3 w-48" />
              </div>
              <AdminSkeleton className="h-8 w-20 rounded-md" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.optOut.empty")}</p>
      ) : (
        <ul className="divide-y text-sm">
          {rows.map((row) => (
            <li key={row.phone_suffix} className="flex items-center justify-between gap-3 py-2">
              <div>
                <div>{row.phone || `…${row.phone_suffix}`}</div>
                <div className="text-xs text-muted-foreground">
                  {row.reason || t("admin.optOut.noReason")} · {new Date(row.created_at).toLocaleDateString()}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => void onRemove(row.phone_suffix)}>
                {t("admin.remove")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
