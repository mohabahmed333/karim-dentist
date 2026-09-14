"use client";

import { Input } from "@/components/ui/input";
import type { PatientNotificationSettings } from "@/services/patient_notifications/types";
import { useTranslations } from "@/lib/i18n";

type Editable = Pick<
  PatientNotificationSettings,
  "quiet_hours_start" | "quiet_hours_end" | "max_per_patient_per_day" | "reminder_lead_minutes" | "recall_enabled" | "review_url" | "timezone"
>;

type Props = {
  settings: Editable;
  onChange: (patch: Partial<Editable>) => void;
};

const SMALL = "h-8 w-16 text-center tabular-nums";
const heading = "text-xs font-medium uppercase tracking-wide text-[var(--admin-muted)]";

export function NotificationScheduleFields({ settings, onChange }: Props) {
  const t = useTranslations();
  const leadIsDay = settings.reminder_lead_minutes === 1440;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className={heading}>{t("admin.notifications.schedule")}</p>

        <div className="flex items-center justify-between gap-2 text-sm">
          <label htmlFor="quiet-start">{t("admin.notifications.quietHours")}</label>
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
              aria-label={t("admin.notifications.quietHoursEndAria")}
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
          <label htmlFor="daily-cap">{t("admin.notifications.dailyCap")}</label>
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
          <label htmlFor="reminder-lead">{t("admin.notifications.reminderLead")}</label>
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
          {t("admin.notifications.hoursInTimezone").replace("{tz}", settings.timezone)}
          {leadIsDay
            ? t("admin.notifications.remindersDayAhead")
            : t("admin.notifications.reminderUse1440")}
        </p>
      </div>

      <div className="space-y-2">
        <p className={heading}>{t("admin.notifications.marketing")}</p>
        <label className="flex cursor-pointer items-start justify-between gap-3 text-sm">
          <span className="space-y-0.5">
            <span className="block">{t("admin.notifications.recallsLabel")}</span>
            <span className="block text-xs text-[var(--admin-muted)]">
              {t("admin.notifications.recallsHint")}
            </span>
          </span>
          <input
            type="checkbox"
            className="mt-1 size-4"
            checked={settings.recall_enabled}
            onChange={(e) => onChange({ recall_enabled: e.target.checked })}
          />
        </label>

        <label className="mt-3 block">
          <span className="text-sm">{t("admin.notifications.reviewLinkLabel")}</span>
          <span className="mb-1 block text-xs text-[var(--admin-muted)]">
            {t("admin.notifications.reviewLinkHint")}
          </span>
          <input
            type="url"
            className="h-9 w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 text-sm outline-none"
            placeholder="https://g.page/r/..."
            value={settings.review_url ?? ""}
            onChange={(e) => onChange({ review_url: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
}
