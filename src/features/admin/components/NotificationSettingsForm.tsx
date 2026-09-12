"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { PatientNotificationSettings } from "@/services/patient_notifications/types";
import { NotificationModeSwitch, type NotificationMode } from "./NotificationModeSwitch";
import { NotificationScheduleFields } from "./NotificationScheduleFields";
import { NotificationStatusColumn } from "./NotificationStatusColumn";
import { NotificationSettingsSkeleton } from "./NotificationStatusSkeleton";
import type { Readiness } from "./notificationReadinessTypes";

const MODE_BADGE: Record<NotificationMode, { label: string; className: string }> = {
  off: { label: "Off", className: "border-[var(--admin-border)] text-[var(--admin-muted)]" },
  dry_run: { label: "Rehearsing", className: "border-[#93C5FD] bg-[#EFF6FF] text-[#1D4ED8]" },
  send: { label: "Live", className: "border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]" },
};

// Loaded separately on purpose: settings come back at once, but the status
// check asks Meta for the template list and can take seconds. The controls
// should not wait for it.
async function fetchSettings(): Promise<PatientNotificationSettings | null> {
  const res = await fetch("/api/v1/notifications/settings");
  if (!res.ok) return null;
  const body = (await res.json()) as { settings?: PatientNotificationSettings };
  return body.settings ?? null;
}

async function fetchReadiness(): Promise<Readiness | null> {
  const res = await fetch("/api/v1/notifications/readiness");
  return res.ok ? ((await res.json()) as Readiness) : null;
}

export function NotificationSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [settings, setSettings] = useState<PatientNotificationSettings | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [checking, setChecking] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchSettings()
      .then((next) => {
        if (alive) setSettings(next);
      })
      .catch(() => {
        if (alive) toast.error("Failed to load notification settings");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    void fetchReadiness()
      .then((next) => {
        if (!alive) return;
        setReadiness(next);
        if (next) setCheckedAt(new Date());
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setChecking(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  /**
   * Re-run the status check on demand: conditions get fixed outside this screen
   * — a migration applied, a template approved — and the check only ran when the
   * tab opened. Results stay on screen while it re-checks, so fixing one thing
   * does not blank the list.
   */
  async function refresh() {
    setRefreshing(true);
    try {
      const next = await fetchReadiness();
      if (next) {
        setReadiness(next);
        setCheckedAt(new Date());
      } else {
        toast.error("Could not check the status");
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function onSave() {
    if (!settings) return;
    setPending(true);
    try {
      const res = await fetch("/api/v1/notifications/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: settings.mode,
          quiet_hours_start: settings.quiet_hours_start,
          quiet_hours_end: settings.quiet_hours_end,
          max_per_patient_per_day: settings.max_per_patient_per_day,
          reminder_lead_minutes: settings.reminder_lead_minutes,
          recall_enabled: settings.recall_enabled,
        }),
      });
      const body = (await res.json()) as { settings?: PatientNotificationSettings; error?: string; blocking?: string[] };
      if (!res.ok) {
        // The server refuses Send while something required is missing, so name it.
        toast.error(body.blocking?.length ? `Still missing: ${body.blocking.join(", ")}` : (body.error ?? "Could not save"));
        return;
      }
      toast.success("Notification settings saved");
      setSettings(body.settings ?? settings);
      // Keep the current status on screen while it refreshes, instead of
      // flashing back to skeletons after every save.
      await refresh();
    } finally {
      setPending(false);
    }
  }

  if (loading) return <NotificationSettingsSkeleton />;
  if (!settings) {
    return (
      <p className="text-sm text-[var(--admin-muted)]">
        No settings found. The database has not been updated with the patient notification tables yet.
      </p>
    );
  }

  const mode = settings.mode as NotificationMode;
  const badge = MODE_BADGE[mode] ?? MODE_BADGE.off;
  const set = (patch: Partial<PatientNotificationSettings>) => setSettings({ ...settings, ...patch });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-medium">Patient notifications</h2>
          <p className="text-xs text-[var(--admin-muted)]">
            WhatsApp confirmations, reminders and follow-ups sent to patients.
          </p>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs ${badge.className}`}>{badge.label}</span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-5 lg:sticky lg:top-4 lg:self-start">
          <NotificationModeSwitch
            value={mode}
            onChange={(next) => set({ mode: next })}
            // Locked until the status check has answered, as well as when it says no.
            sendBlocked={checking || Boolean(readiness && !readiness.canSend)}
          />
          <NotificationScheduleFields settings={settings} onChange={set} />
          <Button type="button" className="w-full" onClick={onSave} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </aside>

        <TooltipProvider delay={150}>
          <NotificationStatusColumn
            readiness={readiness}
            checking={checking}
            refreshing={refreshing}
            checkedAt={checkedAt}
            onRefresh={() => void refresh()}
          />
        </TooltipProvider>
      </div>
    </div>
  );
}
