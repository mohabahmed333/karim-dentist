"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminInput,
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from "@/features/admin/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { saveDoctorIdentity } from "@/services/profiles/actions";
import { doctorIdentityUpsertSchema } from "@/services/profiles/schemas";
import { DOCTOR_COLOR_PALETTE } from "@/services/profiles/colorPalette";
import { saveDoctorServices } from "@/services/service_doctors/actions";
import type { Service } from "@/services/services";
import { useTranslations } from "@/lib/i18n";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";

const DAY_LABELS: { value: number; labelKey: AdminMessageKey }[] = [
  { value: 0, labelKey: "admin.date.weekdayShort.sun" },
  { value: 1, labelKey: "admin.date.weekdayShort.mon" },
  { value: 2, labelKey: "admin.date.weekdayShort.tue" },
  { value: 3, labelKey: "admin.date.weekdayShort.wed" },
  { value: 4, labelKey: "admin.date.weekdayShort.thu" },
  { value: 5, labelKey: "admin.date.weekdayShort.fri" },
  { value: 6, labelKey: "admin.date.weekdayShort.sat" },
];

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

type IdentityFormState = {
  specialty: string;
  bio: string;
  calendar_color: string | null;
};

function identityFromDoctor(doctor: DoctorProfile): IdentityFormState {
  return {
    specialty: doctor.specialty ?? "",
    bio: doctor.bio ?? "",
    calendar_color: doctor.calendar_color,
  };
}

type Props = {
  doctors: DoctorProfile[];
  initialHours: Record<string, DoctorHours>;
  services: Service[];
  /** service_id -> doctor_ids currently mapped to it. Empty/absent = open to every doctor. */
  initialMappings: Record<string, string[]>;
};

export function DoctorsManager({
  doctors: initialDoctors,
  initialHours,
  services,
  initialMappings,
}: Props) {
  const t = useTranslations();
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
  const [identityForms, setIdentityForms] = useState<
    Record<string, IdentityFormState>
  >(() => {
    const out: Record<string, IdentityFormState> = {};
    for (const doctor of initialDoctors) {
      out[doctor.id] = identityFromDoctor(doctor);
    }
    return out;
  });
  // service_id -> doctor_ids currently mapped, kept in sync with the DB only
  // on a successful save (mirrors hoursByDoctor/doctors elsewhere in this
  // file) — this is what the "open to all / restricted to N" badge reads,
  // deliberately separate from the in-progress, unsaved serviceIdForms.
  const [mappings, setMappings] =
    useState<Record<string, string[]>>(initialMappings);
  const [serviceIdForms, setServiceIdForms] = useState<
    Record<string, string[]>
  >(() => {
    const out: Record<string, string[]> = {};
    for (const doctor of initialDoctors) {
      out[doctor.id] = Object.entries(initialMappings)
        .filter(([, doctorIds]) => doctorIds.includes(doctor.id))
        .map(([serviceId]) => serviceId);
    }
    return out;
  });
  // The one service checkbox awaiting the "this will restrict it" confirm —
  // null means no confirm is showing.
  const [pendingRestrictServiceId, setPendingRestrictServiceId] = useState<
    string | null
  >(null);

  const [pending, setPending] = useState(false);
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [savingServices, setSavingServices] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);

  const selectedDoctor = doctors.find((d) => d.id === selectedId);
  const form = forms[selectedId] ?? defaultForm();
  const hasHours = Boolean(hoursByDoctor[selectedId]);
  const identityForm =
    identityForms[selectedId] ??
    (selectedDoctor ? identityFromDoctor(selectedDoctor) : { specialty: "", bio: "", calendar_color: null });
  const selectedServiceIds = serviceIdForms[selectedId] ?? [];

  function patchIdentity(partial: Partial<IdentityFormState>) {
    setIdentityForms((prev) => ({
      ...prev,
      [selectedId]: { ...identityForm, ...partial },
    }));
  }

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
      toast.error(parsed.error.issues[0]?.message ?? t("admin.doctors.invalidHours"));
      return;
    }
    setPending(true);
    try {
      const saved = await saveDoctorHours(selectedId, parsed.data);
      setHoursByDoctor((prev) => ({ ...prev, [selectedId]: saved }));
      setForms((prev) => ({ ...prev, [selectedId]: formFromHours(saved) }));
      toast.success(t("admin.doctors.hoursSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.saveFailed"));
    } finally {
      setPending(false);
    }
  }

  async function onSaveIdentity() {
    if (!selectedId) return;
    const parsed = doctorIdentityUpsertSchema.safeParse({
      specialty: identityForm.specialty.trim() || null,
      bio: identityForm.bio.trim() || null,
      calendar_color: identityForm.calendar_color,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? t("admin.doctors.invalidProfile"));
      return;
    }
    setSavingIdentity(true);
    try {
      await saveDoctorIdentity(selectedId, parsed.data);
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === selectedId
            ? {
                ...d,
                specialty: parsed.data.specialty,
                bio: parsed.data.bio,
                calendar_color: parsed.data.calendar_color,
              }
            : d,
        ),
      );
      toast.success(t("admin.profile.success"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.saveFailed"));
    } finally {
      setSavingIdentity(false);
    }
  }

  function applyServiceToggle(serviceId: string, checked: boolean) {
    setServiceIdForms((prev) => {
      const current = prev[selectedId] ?? [];
      const next = checked
        ? [...current, serviceId]
        : current.filter((id) => id !== serviceId);
      return { ...prev, [selectedId]: next };
    });
  }

  /**
   * Checking a box is only risky the moment it makes a currently-open
   * service *exclusive* — every other doctor is silently narrowed out.
   * Unchecking, or checking a service that's already restricted to someone,
   * needs no warning. See the plan's decision on this: badges + a one-time
   * confirm, not a silent checkbox.
   */
  function toggleService(serviceId: string, checked: boolean) {
    if (checked && (mappings[serviceId] ?? []).length === 0) {
      setPendingRestrictServiceId(serviceId);
      return;
    }
    applyServiceToggle(serviceId, checked);
  }

  function confirmRestrict() {
    if (pendingRestrictServiceId) applyServiceToggle(pendingRestrictServiceId, true);
    setPendingRestrictServiceId(null);
  }

  async function onSaveServices() {
    if (!selectedId) return;
    const serviceIds = serviceIdForms[selectedId] ?? [];
    setSavingServices(true);
    try {
      await saveDoctorServices(selectedId, serviceIds);
      // Mirror the server's delete-then-insert exactly: drop this doctor
      // from every service's list, then add them back to the ones just
      // saved — keeps the cross-doctor badges correct without a refetch.
      setMappings((prev) => {
        const next: Record<string, string[]> = {};
        for (const [svcId, docIds] of Object.entries(prev)) {
          const filtered = docIds.filter((id) => id !== selectedId);
          if (filtered.length > 0) next[svcId] = filtered;
        }
        for (const svcId of serviceIds) {
          next[svcId] = [...(next[svcId] ?? []), selectedId];
        }
        return next;
      });
      toast.success(t("admin.doctors.servicesSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.saveFailed"));
    } finally {
      setSavingServices(false);
    }
  }

  async function onRegenerate() {
    if (!selectedId) return;
    setRegenerating(true);
    try {
      const created = await regenerateOneDoctorSlots(selectedId);
      toast.success(
        t(
          created === 1
            ? "admin.doctors.slotsGeneratedOne"
            : "admin.doctors.slotsGenerated",
        ).replace("{count}", String(created)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.doctors.regenerateFailed"));
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
        throw new Error(body.error ?? t("admin.doctors.removeFailed"));
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
      setServiceIdForms((prev) => {
        const next = { ...prev };
        delete next[removedId];
        return next;
      });
      // list_bookable_doctors_for_service already filters deleted_at IS NULL,
      // so a removed doctor stops being offered regardless — this just keeps
      // the badge counts on screen from still counting them.
      setMappings((prev) => {
        const next: Record<string, string[]> = {};
        for (const [svcId, docIds] of Object.entries(prev)) {
          const filtered = docIds.filter((id) => id !== removedId);
          if (filtered.length > 0) next[svcId] = filtered;
        }
        return next;
      });
      setSelectedId((prev) =>
        prev === removedId
          ? (doctors.find((d) => d.id !== removedId)?.id ?? "")
          : prev,
      );
      setRemoveConfirmOpen(false);
      toast.success(t("admin.doctors.doctorRemoved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.doctors.removeFailed"));
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
            {regenerating ? t("admin.doctors.regenerating") : t("admin.doctors.regenerateSlots")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={savingIdentity || !selectedId}
            onClick={() => void onSaveIdentity()}
          >
            {savingIdentity ? t("admin.saving") : t("admin.profile.save")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={savingServices || !selectedId}
            onClick={() => void onSaveServices()}
          >
            {savingServices ? t("admin.saving") : t("admin.doctors.saveServices")}
          </Button>
          <Button
            type="button"
            disabled={pending || !selectedId}
            onClick={() => void onSave()}
          >
            {pending ? t("admin.saving") : t("admin.doctors.saveHours")}
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
          {t("admin.doctors.emptyState")}
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
                {doctor.display_name ?? t("admin.doctors.unnamed")}
              </span>
              {!hoursByDoctor[doctor.id] ? (
                <span className="ml-2 shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                  {t("admin.doctors.noHoursBadge")}
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
                {t("admin.doctors.bookable")}
              </label>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={removing}
                onClick={() => setRemoveConfirmOpen(true)}
              >
                <Trash2 aria-hidden />
                {t("admin.doctors.removeDoctor")}
              </Button>
            </div>
          </div>

          <SettingsSectionGroup title={t("admin.doctors.profile")} className="space-y-3">
            <label className="grid gap-1">
              <span className="text-[11px] font-medium text-[var(--admin-muted)]">
                {t("admin.profile.specialty")}
              </span>
              <AdminInput
                value={identityForm.specialty}
                placeholder={t("admin.doctors.specialtyPlaceholder")}
                maxLength={120}
                onChange={(e) => patchIdentity({ specialty: e.target.value })}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[11px] font-medium text-[var(--admin-muted)]">
                {t("admin.profile.bio")}
              </span>
              <Textarea
                value={identityForm.bio}
                maxLength={500}
                rows={3}
                onChange={(e) => patchIdentity({ bio: e.target.value })}
              />
            </label>
            <div className="grid gap-1">
              <span className="text-[11px] font-medium text-[var(--admin-muted)]">
                {t("admin.profile.calendarColor")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DOCTOR_COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={color}
                    onClick={() => patchIdentity({ calendar_color: color })}
                    className={`size-6 rounded-full ${
                      identityForm.calendar_color === color
                        ? "ring-2 ring-offset-2 ring-(--admin-text)"
                        : ""
                    }`}
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>
          </SettingsSectionGroup>

          <SettingsSectionGroup
            title={t("admin.doctors.servicesTitle")}
            hint={t("admin.doctors.servicesHint")}
            className="space-y-2"
          >
            {services.length === 0 ? (
              <p className="text-[13px] text-[var(--admin-muted)]">
                {t("admin.doctors.noServices")}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {services.map((service) => {
                  const restrictedTo = mappings[service.id] ?? [];
                  const checked = selectedServiceIds.includes(service.id);
                  return (
                    <label
                      key={service.id}
                      className="flex items-start gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)] p-2.5 text-sm"
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={checked}
                        onCheckedChange={(next) =>
                          toggleService(service.id, next === true)
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[var(--admin-text)]">
                          {service.title}
                        </span>
                        <span
                          className={`block text-[11px] ${
                            restrictedTo.length === 0
                              ? "text-[var(--admin-muted)]"
                              : "text-amber-700"
                          }`}
                        >
                          {restrictedTo.length === 0
                            ? t("admin.doctors.openToAll")
                            : t(
                                restrictedTo.length === 1
                                  ? "admin.doctors.restrictedToOne"
                                  : "admin.doctors.restrictedToMany",
                              ).replace("{count}", String(restrictedTo.length))}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </SettingsSectionGroup>

          <SettingsSectionGroup title={t("admin.doctors.openDays")}>
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
                    {t(day.labelKey)}
                  </button>
                );
              })}
            </div>
          </SettingsSectionGroup>

          <SettingsSectionGroup
            title={t("admin.doctors.timeWindows")}
            hint={t("admin.doctors.timeWindowsHint")}
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
                      {t("admin.from")}
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
                      {t("admin.to")}
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
                    {t("admin.remove")}
                  </Button>
                </div>
              );
            })}
            <Button type="button" variant="outline" size="sm" onClick={addWindow}>
              {t("admin.doctors.addWindow")}
            </Button>
          </SettingsSectionGroup>

          <SettingsSectionGroup title={t("admin.doctors.slotLength")}>
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
                    {t("admin.doctors.minutes").replace("{count}", String(m))}
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
        title={t("admin.doctors.removeConfirmTitle")}
        description={t("admin.doctors.removeConfirmDesc").replace(
          "{name}",
          selectedDoctor?.display_name ?? t("admin.doctors.thisDoctor"),
        )}
        onConfirm={() => void onRemoveDoctor()}
      />

      <Dialog
        open={pendingRestrictServiceId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRestrictServiceId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.doctors.restrictTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin.doctors.restrictDesc")
                .replace(
                  "{service}",
                  services.find((s) => s.id === pendingRestrictServiceId)
                    ?.title ?? t("admin.doctors.thisService"),
                )
                .replace(
                  "{doctor}",
                  selectedDoctor?.display_name ?? t("admin.doctors.thisDoctor"),
                )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingRestrictServiceId(null)}
            >
              {t("admin.cancel")}
            </Button>
            <Button type="button" onClick={confirmRestrict}>
              {t("admin.doctors.restrictConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
