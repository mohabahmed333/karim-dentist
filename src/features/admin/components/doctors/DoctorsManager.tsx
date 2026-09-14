"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from "@/features/admin/ui";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { ConfirmDeleteDialog } from "@/features/admin/components/ConfirmDeleteDialog";
import { SettingsSectionGroup } from "@/features/admin/components/SettingsSectionGroup";
import {
  suggestNonOverlappingWindow,
  timeWindowsIssue,
} from "@/services/clinic_schedule";
import { doctorHoursUpsertSchema } from "@/services/doctor_schedule/schemas";
import type { DoctorHours } from "@/services/doctor_schedule/types";
import {
  regenerateOneDoctorSlots,
  saveDoctorHours,
} from "@/services/doctor_schedule/actions";
import type { DoctorProfile } from "@/services/profiles";

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

function parseWindow(window: string): { start: string; end: string } {
  const [start = "10:00", end = "12:00"] = window.split("-");
  return { start: normalizeTime(start), end: normalizeTime(end) };
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

type FormState = {
  open_weekdays: number[];
  time_windows: string[];
  slot_minutes: number;
  is_bookable: boolean;
};

function defaultForm(): FormState {
  return {
    open_weekdays: [0, 1, 2, 3, 4],
    time_windows: ["10:00-13:00", "14:00-18:00"],
    slot_minutes: 60,
    is_bookable: true,
  };
}

function formFromHours(hours: DoctorHours): FormState {
  return {
    open_weekdays: hours.open_weekdays,
    time_windows: hours.time_windows,
    slot_minutes: hours.slot_minutes,
    is_bookable: hours.is_bookable,
  };
}

type Props = {
  doctors: DoctorProfile[];
  initialHours: Record<string, DoctorHours>;
};

export function DoctorsManager({
  doctors: initialDoctors,
  initialHours,
}: Props) {
  const [doctors, setDoctors] = useState(initialDoctors);
  const [hoursByDoctor, setHoursByDoctor] =
    useState<Record<string, DoctorHours>>(initialHours);
  const [selectedId, setSelectedId] = useState(initialDoctors[0]?.id ?? "");
  const [forms, setForms] = useState<Record<string, FormState>>(() => {
    const out: Record<string, FormState> = {};
    for (const doctor of initialDoctors) {
      out[doctor.id] = initialHours[doctor.id]
        ? formFromHours(initialHours[doctor.id])
        : defaultForm();
    }
    return out;
  });
  const [pending, setPending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);

  const selectedDoctor = doctors.find((d) => d.id === selectedId);
  const form = forms[selectedId] ?? defaultForm();
  const hasHours = Boolean(hoursByDoctor[selectedId]);

  function patchForm(partial: Partial<FormState>) {
    setForms((prev) => ({
      ...prev,
      [selectedId]: { ...(prev[selectedId] ?? defaultForm()), ...partial },
    }));
  }

  function toggleDay(day: number) {
    const next = form.open_weekdays.includes(day)
      ? form.open_weekdays.filter((d) => d !== day)
      : [...form.open_weekdays, day].sort();
    patchForm({ open_weekdays: next });
  }

  function updateWindow(index: number, part: "start" | "end", value: string) {
    const current = parseWindow(form.time_windows[index] ?? "10:00-12:00");
    const start = part === "start" ? value : current.start;
    const end = part === "end" ? value : current.end;
    const next = [...form.time_windows];
    next[index] = joinWindow(start, end);
    const issue = timeWindowsIssue(next.filter(Boolean));
    if (issue) {
      toast.error(issue);
      return;
    }
    patchForm({ time_windows: next });
  }

  function addWindow() {
    const candidate = suggestNonOverlappingWindow(
      form.time_windows.filter(Boolean),
    );
    const next = [...form.time_windows, candidate];
    const issue = timeWindowsIssue(next.filter(Boolean));
    if (issue) {
      toast.error(issue);
      return;
    }
    patchForm({ time_windows: next });
  }

  async function onSave() {
    if (!selectedId) return;
    const parsed = doctorHoursUpsertSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid hours");
      return;
    }
    setPending(true);
    try {
      const saved = await saveDoctorHours(selectedId, parsed.data);
      setHoursByDoctor((prev) => ({ ...prev, [selectedId]: saved }));
      setForms((prev) => ({ ...prev, [selectedId]: formFromHours(saved) }));
      toast.success("Hours saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  async function onRegenerate() {
    if (!selectedId) return;
    setRegenerating(true);
    try {
      const created = await regenerateOneDoctorSlots(selectedId);
      toast.success(`${created} open slot${created === 1 ? "" : "s"} generated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Regenerate failed");
    } finally {
      setRegenerating(false);
    }
  }

  /**
   * Deactivates the doctor's staff account (soft-delete via the existing
   * accounts endpoint) rather than deleting anything — their past
   * reservations and clinical notes still need doctor_id to resolve, and
   * this matches how every other staff account is removed in the app.
   */
  async function onRemoveDoctor() {
    if (!selectedId) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/v1/admin/accounts/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Remove failed");
      }
      const removedId = selectedId;
      setDoctors((prev) => prev.filter((d) => d.id !== removedId));
      setHoursByDoctor((prev) => {
        const next = { ...prev };
        delete next[removedId];
        return next;
      });
      setForms((prev) => {
        const next = { ...prev };
        delete next[removedId];
        return next;
      });
      setSelectedId((prev) =>
        prev === removedId
          ? (doctors.find((d) => d.id !== removedId)?.id ?? "")
          : prev,
      );
      setRemoveConfirmOpen(false);
      toast.success("Doctor removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setRemoving(false);
    }
  }

  const header = (
    <LocalizedAdminPageHeader
      titleKey="admin.settings.doctors"
      actions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={regenerating || !selectedId || !hasHours}
            onClick={() => void onRegenerate()}
          >
            {regenerating ? "Regenerating…" : "Regenerate slots"}
          </Button>
          <Button
            type="button"
            disabled={pending || !selectedId}
            onClick={() => void onSave()}
          >
            {pending ? "Saving…" : "Save hours"}
          </Button>
        </div>
      }
    />
  );

  if (doctors.length === 0) {
    return (
      <div className="space-y-4">
        {header}
        <Card className="max-w-3xl gap-0 bg-transparent p-6 text-sm text-[var(--admin-muted)]">
          No staff accounts are marked as doctors yet. Give an account the
          Doctor role (or flag another role as a doctor role) in Roles, then
          come back here to set their hours.
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {header}
      <Card className="grid max-w-3xl grid-cols-1 gap-6 bg-transparent p-6 lg:grid-cols-[220px_1fr]">
        <div className="space-y-1">
          {doctors.map((doctor) => (
            <button
              key={doctor.id}
              type="button"
              onClick={() => setSelectedId(doctor.id)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                doctor.id === selectedId
                  ? "bg-[var(--admin-hover)] font-medium text-[var(--admin-text)]"
                  : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]/60"
              }`}
            >
              <span className="truncate">
                {doctor.display_name ?? "Unnamed"}
              </span>
              {!hoursByDoctor[doctor.id] ? (
                <span className="ml-2 shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                  No hours
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {selectedDoctor ? (
          <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--admin-text)]">
              {selectedDoctor.display_name ?? "Unnamed"}
            </h2>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-[var(--admin-muted)]">
                <Checkbox
                  checked={form.is_bookable}
                  onCheckedChange={(checked) =>
                    patchForm({ is_bookable: checked === true })
                  }
                />
                Bookable
              </label>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={removing}
                onClick={() => setRemoveConfirmOpen(true)}
              >
                <Trash2 aria-hidden />
                Remove doctor
              </Button>
            </div>
          </div>

          <SettingsSectionGroup title="Open days">
            <div className="flex flex-wrap gap-2">
              {DAY_LABELS.map((day) => {
                const on = form.open_weekdays.includes(day.value);
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
          </SettingsSectionGroup>

          <SettingsSectionGroup
            title="Time windows"
            hint="Choose From / To times from the lists — no typing."
            className="space-y-3"
          >
            {form.time_windows.map((w, i) => {
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
                    <AdminSelect
                      value={start}
                      onValueChange={(value) =>
                        updateWindow(i, "start", String(value))
                      }
                    >
                      <AdminSelectTrigger className="w-full">
                        <AdminSelectValue />
                      </AdminSelectTrigger>
                      <AdminSelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <AdminSelectItem key={`s-${i}-${time}`} value={time}>
                            {time}
                          </AdminSelectItem>
                        ))}
                      </AdminSelectContent>
                    </AdminSelect>
                  </label>
                  <label className="grid min-w-[8rem] flex-1 gap-1">
                    <span className="text-[11px] font-medium text-[var(--admin-muted)]">
                      To
                    </span>
                    <AdminSelect
                      value={end}
                      onValueChange={(value) =>
                        updateWindow(i, "end", String(value))
                      }
                    >
                      <AdminSelectTrigger className="w-full">
                        <AdminSelectValue />
                      </AdminSelectTrigger>
                      <AdminSelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <AdminSelectItem key={`e-${i}-${time}`} value={time}>
                            {time}
                          </AdminSelectItem>
                        ))}
                      </AdminSelectContent>
                    </AdminSelect>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() =>
                      patchForm({
                        time_windows: form.time_windows.filter(
                          (_, j) => j !== i,
                        ),
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              );
            })}
            <Button type="button" variant="outline" size="sm" onClick={addWindow}>
              Add window
            </Button>
          </SettingsSectionGroup>

          <SettingsSectionGroup title="Slot length">
            <AdminSelect
              value={String(form.slot_minutes)}
              onValueChange={(value) =>
                patchForm({ slot_minutes: Number(value) })
              }
            >
              <AdminSelectTrigger className="w-48">
                <AdminSelectValue />
              </AdminSelectTrigger>
              <AdminSelectContent>
                {[15, 30, 45, 60, 90, 120].map((m) => (
                  <AdminSelectItem key={m} value={String(m)}>
                    {m} minutes
                  </AdminSelectItem>
                ))}
              </AdminSelectContent>
            </AdminSelect>
          </SettingsSectionGroup>
        </div>
      ) : null}
      </Card>

      <ConfirmDeleteDialog
        open={removeConfirmOpen}
        onOpenChange={setRemoveConfirmOpen}
        pending={removing}
        title="Remove this doctor?"
        description={`${selectedDoctor?.display_name ?? "This doctor"}'s account will be deactivated — their past reservations and notes stay on record, and an admin can reactivate the account from Settings > Accounts.`}
        onConfirm={() => void onRemoveDoctor()}
      />
    </div>
  );
}
