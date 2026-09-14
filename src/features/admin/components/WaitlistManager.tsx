"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/lib/supabase/database.types";
import { AdminSkeleton } from "./AdminSkeleton";
import { useTranslations } from "@/lib/i18n";
import type { AnyMessageKey } from "@/lib/i18n";

type Entry = Tables<"appointment_waitlist">;

async function fetchEntries(): Promise<Entry[]> {
  const res = await fetch("/api/v1/waitlist");
  if (!res.ok) throw new Error("load failed");
  const data = (await res.json()) as { entries?: Entry[] };
  return data.entries ?? [];
}

/** `datetime-local` gives local wall-clock time with no zone; send an instant. */
function toIso(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text ? new Date(text).toISOString() : null;
}

function windowLabel(entry: Entry, t: (key: AnyMessageKey) => string): string {
  const fmt = (iso: string) => new Date(iso).toLocaleString();
  if (!entry.preferred_from && !entry.preferred_to) return t("admin.waitlist.anyTime");
  if (entry.preferred_from && entry.preferred_to) {
    return `${fmt(entry.preferred_from)} – ${fmt(entry.preferred_to)}`;
  }
  return entry.preferred_from
    ? t("admin.waitlist.fromTime").replace("{time}", fmt(entry.preferred_from))
    : t("admin.waitlist.untilTime").replace("{time}", fmt(entry.preferred_to!));
}

/**
 * Patients waiting for an earlier appointment.
 *
 * When a booked slot is cancelled, the three longest-waiting patients whose
 * window contains it are offered it on WhatsApp, and the first to answer gets it.
 */
export function WaitlistManager() {
  const t = useTranslations();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetchEntries()
      .then((next) => {
        if (alive) setEntries(next);
      })
      .catch(() => {
        if (alive) {
          setEntries([]);
          toast.error(t("admin.waitlist.loadFailed"));
        }
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
      const res = await fetch("/api/v1/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: String(form.get("patient_name") ?? ""),
          phone: String(form.get("phone") ?? ""),
          service_label: String(form.get("service_label") ?? ""),
          preferred_from: toIso(form.get("preferred_from")),
          preferred_to: toIso(form.get("preferred_to")),
        }),
      });
      const body = (await res.json()) as { entry?: Entry; error?: string };
      if (!res.ok || !body.entry) {
        toast.error(body.error ?? t("admin.waitlist.addFailed"));
        return;
      }
      setEntries((prev) => [...(prev ?? []), body.entry!]);
      formEl.reset();
      toast.success(t("admin.waitlist.added"));
    } finally {
      setPending(false);
    }
  }

  async function onRemove(id: string) {
    const res = await fetch(`/api/v1/waitlist/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(t("admin.optOut.removeFailed"));
      return;
    }
    setEntries((prev) => (prev ?? []).filter((e) => e.id !== id));
    toast.success(t("admin.waitlist.removed"));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="gap-2 p-4">
        {entries === null ? (
          <div aria-busy="true" className="divide-y">
            <span className="sr-only">{t("admin.waitlist.loading")}</span>
            {["w-40", "w-32", "w-44"].map((w) => (
              <div key={w} className="flex items-start justify-between gap-3 py-2.5">
                <div className="space-y-1.5">
                  <AdminSkeleton className={`h-4 ${w}`} />
                  <AdminSkeleton className="h-3 w-64" />
                </div>
                <AdminSkeleton className="h-8 w-20 rounded-md" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("admin.waitlist.empty")}
          </p>
        ) : (
          <ul className="divide-y">
            {entries.map((entry, index) => (
              <li key={entry.id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0 space-y-0.5 text-sm">
                  <div className="font-medium">
                    <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                    {entry.patient_name}
                    {entry.status === "offered" ? (
                      <span className="ml-2 rounded border border-[#93C5FD] bg-[#EFF6FF] px-1.5 py-0.5 text-xs text-[#1D4ED8]">
                        {t("admin.waitlist.offeredBadge")}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.phone}
                    {entry.service_label ? ` · ${entry.service_label}` : ""} · {windowLabel(entry, t)}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => void onRemove(entry.id)}>
                  {t("admin.remove")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="gap-0 p-4">
        <form className="space-y-3" onSubmit={(e) => void onAdd(e)}>
          <h3 className="text-sm font-medium">{t("admin.waitlist.addPatient")}</h3>
          <div className="space-y-1.5">
            <Label htmlFor="wl-name">{t("admin.name")}</Label>
            <Input id="wl-name" name="patient_name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wl-phone">{t("admin.waitlist.whatsappNumber")}</Label>
            <Input id="wl-phone" name="phone" required placeholder={t("admin.optOut.phonePlaceholder")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wl-service">{t("admin.waitlist.service")}</Label>
            <Input id="wl-service" name="service_label" placeholder="Cleaning" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wl-from">{t("admin.waitlist.earliestLabel")}</Label>
            <Input id="wl-from" name="preferred_from" type="datetime-local" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wl-to">{t("admin.waitlist.latestLabel")}</Label>
            <Input id="wl-to" name="preferred_to" type="datetime-local" />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("admin.waitlist.windowHint")}
          </p>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t("admin.waitlist.adding") : t("admin.waitlist.addToWaitlist")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
