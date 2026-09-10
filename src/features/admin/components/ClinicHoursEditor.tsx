"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { notifyRevalidate } from "@/services/admin/revalidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clinicHoursUpsertSchema,
  getClinicHours,
  saveClinicHours,
  suggestNonOverlappingWindow,
  timeWindowsIssue,
  type ClinicHours,
} from "@/services/clinic_schedule";

const DAY_LABELS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const;

const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 6; h <= 22; h += 1) {
    for (const m of [0, 15, 30, 45]) {
      if (h === 22 && m > 0) break;
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

const SELECT_CLASS =
  "h-9 w-full cursor-pointer rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)] px-3 text-sm text-[var(--admin-text,#1a1a1a)] outline-none";

function parseWindow(window: string): { start: string; end: string } {
  const [start = "10:00", end = "12:00"] = window.split("-");
  return {
    start: normalizeTime(start),
    end: normalizeTime(end),
  };
}

function normalizeTime(raw: string): string {
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "10:00";
  const h = String(Math.min(23, Number(match[1]))).padStart(2, "0");
  const m = String(Math.min(59, Number(match[2]))).padStart(2, "0");
  const value = `${h}:${m}`;
  return TIME_OPTIONS.includes(value) ? value : "10:00";
}

function joinWindow(start: string, end: string): string {
  return `${normalizeTime(start)}-${normalizeTime(end)}`;
}

export function ClinicHoursEditor() {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [openWeekdays, setOpenWeekdays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [windows, setWindows] = useState<string[]>(["10:00-13:00", "14:00-18:00"]);
  const [slotMinutes, setSlotMinutes] = useState(60);
  const [horizonDays, setHorizonDays] = useState(21);

  useEffect(() => {
    let alive = true;
    void getClinicHours()
      .then((row: ClinicHours) => {
        if (!alive) return;
        setOpenWeekdays(row.open_weekdays);
        setWindows(row.time_windows);
        setSlotMinutes(row.slot_minutes);
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

  function toggleDay(day: number) {
    setOpenWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  }

  function updateWindow(index: number, part: "start" | "end", value: string) {
    setWindows((prev) => {
      const next = [...prev];
      const current = parseWindow(next[index] ?? "10:00-12:00");
      const start = part === "start" ? value : current.start;
      const end = part === "end" ? value : current.end;
      next[index] = joinWindow(start, end);
      const issue = timeWindowsIssue(next.filter(Boolean));
      if (issue) {
        queueMicrotask(() => toast.error(issue));
        return prev;
      }
      return next;
    });
  }

  function addWindow() {
    const candidate = suggestNonOverlappingWindow(windows.filter(Boolean));
    const next = [...windows, candidate];
    const issue = timeWindowsIssue(next.filter(Boolean));
    if (issue) {
      toast.error(issue);
      return;
    }
    setWindows(next);
  }

  async function onSave() {
    const parsed = clinicHoursUpsertSchema.safeParse({
      open_weekdays: openWeekdays,
      time_windows: windows.filter(Boolean),
      slot_minutes: slotMinutes,
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
      setOpenWeekdays(saved.open_weekdays);
      setWindows(saved.time_windows);
      setSlotMinutes(saved.slot_minutes);
      setHorizonDays(saved.horizon_days);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.saveFailed"));
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--admin-muted)]">Loading clinic hours…</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-[var(--admin-text)]">Open days</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DAY_LABELS.map((day) => {
            const on = openWeekdays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  on
                    ? "border-[var(--admin-primary)] bg-[var(--admin-primary)] text-white"
                    : "border-[var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)]"
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Time windows</Label>
        <p className="text-[12px] text-[var(--admin-muted)]">
          Choose From / To times from the lists — no typing.
        </p>
        {windows.map((w, i) => {
          const { start, end } = parseWindow(w);
          return (
            <div
              key={i}
              className="flex flex-wrap items-end gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)] p-2.5"
            >
              <label className="grid min-w-[8rem] flex-1 gap-1">
                <span className="text-[11px] font-medium text-[var(--admin-muted)]">
                  From
                </span>
                <select
                  className={SELECT_CLASS}
                  value={start}
                  onChange={(e) => updateWindow(i, "start", e.target.value)}
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={`s-${i}-${t}`} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid min-w-[8rem] flex-1 gap-1">
                <span className="text-[11px] font-medium text-[var(--admin-muted)]">
                  To
                </span>
                <select
                  className={SELECT_CLASS}
                  value={end}
                  onChange={(e) => updateWindow(i, "end", e.target.value)}
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={`e-${i}-${t}`} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setWindows(windows.filter((_, j) => j !== i))}
              >
                Remove
              </Button>
            </div>
          );
        })}
        <Button type="button" variant="outline" size="sm" onClick={addWindow}>
          Add window
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <Label>Slot length (minutes)</Label>
          <select
            className={SELECT_CLASS}
            value={slotMinutes}
            onChange={(e) => setSlotMinutes(Number(e.target.value))}
          >
            {[15, 30, 45, 60, 90, 120].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <Label>Publish horizon (days)</Label>
          <Input
            type="number"
            min={7}
            max={60}
            value={horizonDays}
            onChange={(e) => setHorizonDays(Number(e.target.value))}
          />
        </label>
      </div>

      <Button type="button" disabled={pending} onClick={() => void onSave()}>
        {pending ? t("admin.saving") : t("admin.pages.hours.save")}
      </Button>
    </div>
  );
}
