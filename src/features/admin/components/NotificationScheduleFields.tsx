"use client";

import { Input } from "@/components/ui/input";
import type { PatientNotificationSettings } from "@/services/patient_notifications/types";

type Editable = Pick<
  PatientNotificationSettings,
  "quiet_hours_start" | "quiet_hours_end" | "max_per_patient_per_day" | "reminder_lead_minutes" | "recall_enabled" | "timezone"
>;

type Props = {
  settings: Editable;
  onChange: (patch: Partial<Editable>) => void;
};

const SMALL = "h-8 w-16 text-center tabular-nums";
const heading = "text-xs font-medium uppercase tracking-wide text-[var(--admin-muted)]";

export function NotificationScheduleFields({ settings, onChange }: Props) {
  const leadIsDay = settings.reminder_lead_minutes === 1440;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className={heading}>Schedule</p>

        <div className="flex items-center justify-between gap-2 text-sm">
          <label htmlFor="quiet-start">Quiet hours</label>
          <span className="flex items-center gap-1.5">
            <Input
              id="quiet-start"
              type="number"
              min={0}
              max={23}
              className={SMALL}
              value={settings.quiet_hours_start}
              onChange={(e) => onChange({ quiet_hours_start: Number(e.target.value) })}
            />
            <span aria-hidden className="text-[var(--admin-muted)]">→</span>
            <Input
              aria-label="Quiet hours end"
              type="number"
              min={0}
              max={23}
              className={SMALL}
              value={settings.quiet_hours_end}
              onChange={(e) => onChange({ quiet_hours_end: Number(e.target.value) })}
            />
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-sm">
          <label htmlFor="daily-cap">Messages per patient per day</label>
          <Input
            id="daily-cap"
            type="number"
            min={0}
            max={20}
            className={SMALL}
            value={settings.max_per_patient_per_day}
            onChange={(e) => onChange({ max_per_patient_per_day: Number(e.target.value) })}
          />
        </div>

        <div className="flex items-center justify-between gap-2 text-sm">
          <label htmlFor="reminder-lead">Reminder lead (minutes)</label>
          <Input
            id="reminder-lead"
            type="number"
            min={60}
            max={10080}
            step={60}
            className={`${SMALL} w-20`}
            value={settings.reminder_lead_minutes}
            onChange={(e) => onChange({ reminder_lead_minutes: Number(e.target.value) })}
          />
        </div>

        <p className={`text-xs ${leadIsDay ? "text-[var(--admin-muted)]" : "text-[#B45309]"}`}>
          Hours in {settings.timezone}.{" "}
          {leadIsDay
            ? "Reminders go out 24 hours ahead."
            : "Use 1440 — the reminder text says “tomorrow”, so other values are skipped."}
        </p>
      </div>

      <div className="space-y-2">
        <p className={heading}>Marketing</p>
        <label className="flex cursor-pointer items-start justify-between gap-3 text-sm">
          <span className="space-y-0.5">
            <span className="block">Recalls and review requests</span>
            <span className="block text-xs text-[var(--admin-muted)]">
              Separate from Send. Needs its own templates and patient consent.
            </span>
          </span>
          <input
            type="checkbox"
            className="mt-1 size-4"
            checked={settings.recall_enabled}
            onChange={(e) => onChange({ recall_enabled: e.target.checked })}
          />
        </label>
      </div>
    </div>
  );
}
