"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PatientNotificationSettings } from "@/services/patient_notifications/types";
import {
  NotificationReadinessPanel,
  type Readiness,
} from "./NotificationReadinessPanel";

const SELECT_CLASS =
  "h-9 w-full cursor-pointer rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)] px-3 text-sm text-[var(--admin-text,#1a1a1a)] outline-none";

type Mode = "off" | "dry_run" | "send";

const MODE_HINTS: Record<Mode, string> = {
  off: "No patient is messaged. Notifications are still queued, so nothing is lost while this is off.",
  dry_run:
    "Queues and renders every message — the real template, the real wording — but sends nothing. Use this for a week and read the queue before switching on.",
  send: "Patients receive booking confirmations and a reminder the day before.",
};

const MODE_BADGE: Record<Mode, string> = {
  off: "border-[var(--admin-border)] text-[var(--admin-muted)]",
  dry_run: "border-[#93C5FD] bg-[#EFF6FF] text-[#1D4ED8]",
  send: "border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]",
};

async function fetchAll(): Promise<{
  settings: PatientNotificationSettings | null;
  readiness: Readiness | null;
}> {
  const [s, r] = await Promise.all([
    fetch("/api/v1/notifications/settings").then((res) => (res.ok ? res.json() : null)),
    fetch("/api/v1/notifications/readiness").then((res) => (res.ok ? res.json() : null)),
  ]);
  return { settings: s?.settings ?? null, readiness: r ?? null };
}

export function NotificationSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [settings, setSettings] = useState<PatientNotificationSettings | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchAll()
      .then((next) => {
        if (!alive) return;
        setSettings(next.settings);
        setReadiness(next.readiness);
      })
      .catch(() => {
        if (alive) toast.error("Failed to load notification settings");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

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
        }),
      });
      const body = (await res.json()) as {
        settings?: PatientNotificationSettings;
        error?: string;
        blocking?: string[];
      };
      if (!res.ok) {
        // The server refuses to arm sending while something required is
        // missing, so say which thing rather than "save failed".
        toast.error(
          body.blocking?.length
            ? `Still missing: ${body.blocking.join(", ")}`
            : (body.error ?? "Could not save"),
        );
        return;
      }
      toast.success("Notification settings saved");
      const next = await fetchAll();
      setSettings(next.settings ?? body.settings ?? settings);
      setReadiness(next.readiness);
    } finally {
      setPending(false);
    }
  }

  if (loading) return <p className="text-sm text-[var(--admin-muted)]">Loading…</p>;
  if (!settings) {
    return (
      <p className="text-sm text-[var(--admin-muted)]">
        No settings row found. Apply the patient notification migrations first.
      </p>
    );
  }

  const mode = settings.mode as Mode;
  const set = (patch: Partial<PatientNotificationSettings>) =>
    setSettings({ ...settings, ...patch });
  const sendBlocked = Boolean(readiness && !readiness.canSend);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">Patient notifications</h2>
          <p className="text-xs text-[var(--admin-muted)]">
            WhatsApp confirmations when an appointment is booked, and a reminder
            the day before.
          </p>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-xs ${MODE_BADGE[mode]}`}>
          {mode === "off" ? "Off" : mode === "dry_run" ? "Rehearsing" : "Live"}
        </span>
      </div>

      {readiness ? <NotificationReadinessPanel readiness={readiness} /> : null}

      <label className="space-y-1.5">
        <Label>Mode</Label>
        <select
          className={SELECT_CLASS}
          value={mode}
          onChange={(e) => set({ mode: e.target.value })}
        >
          <option value="off">Off</option>
          <option value="dry_run">Dry run — render everything, send nothing</option>
          <option value="send" disabled={sendBlocked}>
            Send to patients{sendBlocked ? " (blocked — see above)" : ""}
          </option>
        </select>
        <p className="text-xs text-[var(--admin-muted)]">{MODE_HINTS[mode]}</p>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <Label>Quiet from (hour)</Label>
          <Input
            type="number"
            min={0}
            max={23}
            value={settings.quiet_hours_start}
            onChange={(e) => set({ quiet_hours_start: Number(e.target.value) })}
          />
        </label>
        <label className="space-y-1.5">
          <Label>Quiet until (hour)</Label>
          <Input
            type="number"
            min={0}
            max={23}
            value={settings.quiet_hours_end}
            onChange={(e) => set({ quiet_hours_end: Number(e.target.value) })}
          />
        </label>
      </div>
      <p className="-mt-2 text-xs text-[var(--admin-muted)]">
        Local time in {settings.timezone}. Nothing is sent inside this window; it
        waits for the morning.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <Label>Max messages per patient per day</Label>
          <Input
            type="number"
            min={0}
            max={20}
            value={settings.max_per_patient_per_day}
            onChange={(e) => set({ max_per_patient_per_day: Number(e.target.value) })}
          />
        </label>
        <label className="space-y-1.5">
          <Label>Reminder sent this many minutes ahead</Label>
          <Input
            type="number"
            min={60}
            max={10080}
            step={60}
            value={settings.reminder_lead_minutes}
            onChange={(e) => set({ reminder_lead_minutes: Number(e.target.value) })}
          />
        </label>
      </div>
      <p className="-mt-2 text-xs text-[var(--admin-muted)]">
        The approved reminder template says &quot;tomorrow&quot;, so 1440
        (24&nbsp;hours) is the only value that reads correctly. Anything else and
        the reminder is skipped rather than sent with the wrong day.
      </p>

      <div className="flex justify-end">
        <Button type="button" onClick={onSave} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
