"use client";

import { AdminSkeleton } from "./AdminSkeleton";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { notifyRevalidate } from "@/services/admin/revalidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SettingsHintBanner,
  SettingsSaveRow,
  SettingsSectionGroup,
} from "./SettingsSectionGroup";
import {
  clinicHoursUpsertSchema,
  getClinicHours,
  saveClinicHours,
  type ClinicHours,
} from "@/services/clinic_schedule";

/**
 * Weekdays/time windows/slot length used to live here, but each doctor now
 * sets their own on Settings > Doctors — a clinic-wide schedule with no
 * doctor attached stopped meaning anything once there was more than one.
 * This page keeps only what's still genuinely clinic-wide: how many days
 * ahead booking is open. The retired fields are loaded and carried forward
 * unchanged on save (nothing reads them for slot generation anymore), never
 * edited here.
 */
export function ClinicHoursEditor() {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [retired, setRetired] = useState<Pick<
    ClinicHours,
    "open_weekdays" | "time_windows" | "slot_minutes"
  > | null>(null);
  const [horizonDays, setHorizonDays] = useState(21);

  useEffect(() => {
    let alive = true;
    void getClinicHours()
      .then((row: ClinicHours) => {
        if (!alive) return;
        setRetired({
          open_weekdays: row.open_weekdays,
          time_windows: row.time_windows,
          slot_minutes: row.slot_minutes,
        });
        setHorizonDays(row.horizon_days);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to load hours");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function onSave() {
    if (!retired) return;
    const parsed = clinicHoursUpsertSchema.safeParse({
      open_weekdays: retired.open_weekdays,
      time_windows: retired.time_windows,
      slot_minutes: retired.slot_minutes,
      horizon_days: horizonDays,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid hours");
      return;
    }
    setPending(true);
    try {
      const saved = await saveClinicHours(parsed.data);
      toast.success(t("admin.pages.hours.saved"));
      notifyRevalidate(["clinic-hours"]);
      setHorizonDays(saved.horizon_days);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.saveFailed"));
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div aria-busy="true" className="space-y-5">
        <span className="sr-only">Loading booking settings…</span>
        <AdminSkeleton className="h-3.5 w-64" />
        <div className="space-y-2">
          <AdminSkeleton className="h-3.5 w-32" />
          <AdminSkeleton className="h-9 w-40 rounded-md" />
        </div>
        <AdminSkeleton className="h-9 w-32 rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsHintBanner>
        Open days, time windows and slot length are set per doctor now — see
        Settings &gt; Doctors. This page only controls how far ahead the
        booking calendar opens.
      </SettingsHintBanner>

      <SettingsSectionGroup title="Booking horizon">
        <label className="block max-w-xs space-y-1.5">
          <Label>Publish horizon (days)</Label>
          <Input
            type="number"
            min={7}
            max={60}
            value={horizonDays}
            onChange={(e) => setHorizonDays(Number(e.target.value))}
          />
        </label>
      </SettingsSectionGroup>

      <SettingsSaveRow>
        <Button type="button" disabled={pending} onClick={() => void onSave()}>
          {pending ? t("admin.saving") : t("admin.pages.hours.save")}
        </Button>
      </SettingsSaveRow>
    </div>
  );
}
