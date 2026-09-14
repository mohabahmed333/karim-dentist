"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Tables } from "@/lib/supabase/database.types";
import { pickLocalized, useLocale, useTranslations } from "@/lib/i18n";
import { hasVisibleServiceTitle } from "@/features/portfolio/lib/serviceKindGroups";
import { buildShowreelBookingSlots } from "@/features/portfolio/showreel/product-scenes/buildShowreelBookingSlots";
import {
  BookingSchedulePicker,
  type BookingDateOption,
} from "./BookingSchedulePicker";
import { DentalButton } from "./DentalButton";
import { useBookingFormShowreel } from "./useBookingFormShowreel";

type SlotDto = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: "open" | "booked";
  /** Optional so the showreel demo's own local SlotDto (no doctor concept) still fits. */
  doctor_id?: string | null;
};

type DoctorOption = {
  id: string;
  displayName: string | null;
  specialty: string | null;
  nextSlot: { id: string; startsAt: string } | null;
};

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type BookingFormProps = {
  services: Tables<"services">[];
};

export function BookingForm({ services }: BookingFormProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [showreel, setShowreel] = useState(false);
  const [slots, setSlots] = useState<SlotDto[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  // "" = no preference (show every eligible doctor's times together — see
  // decision #5 in the Stage 2 plan, deliberately different from WhatsApp's
  // eager resolve-to-one-doctor).
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  useEffect(() => {
    setShowreel(document.documentElement.dataset.showreelDemo === "1");
  }, []);

  // "consultation" is a sentinel with no real row; everything else must
  // resolve to a real service id or nothing at all. Shared between the
  // doctor fetch below and onSubmit so they can never disagree about which
  // service is actually selected.
  const resolvedServiceId = useMemo(() => {
    if (!serviceId || serviceId === "consultation") return null;
    return services.some((s) => s.id === serviceId) ? serviceId : null;
  }, [serviceId, services]);

  // A previously picked doctor may not be eligible for a newly picked
  // service — clear it the moment the service changes, so it can never be
  // submitted stale while the new doctor list is still loading. Adjusted
  // during render (React's documented "reset state when a prop/dependency
  // changes" pattern) rather than in the fetch effect below, so this reset
  // is never tangled up with that effect's own async work.
  const [doctorsLoadedForService, setDoctorsLoadedForService] =
    useState(resolvedServiceId);
  if (resolvedServiceId !== doctorsLoadedForService) {
    setDoctorsLoadedForService(resolvedServiceId);
    setSelectedDoctorId("");
  }

  const ourServices = useMemo(
    () =>
      services.filter(
        (s) =>
          s.kind !== "laser" &&
          hasVisibleServiceTitle(pickLocalized(locale, s.title, s.title_ar)),
      ),
    [services, locale],
  );
  const laserServices = useMemo(
    () =>
      services.filter(
        (s) =>
          s.kind === "laser" &&
          hasVisibleServiceTitle(pickLocalized(locale, s.title, s.title_ar)),
      ),
    [services, locale],
  );

  async function loadSlots() {
    setSlotsLoading(true);
    try {
      if (document.documentElement.dataset.showreelDemo === "1") {
        // Deterministic, zero-network demo slots — a real fetch ties the
        // demo to live production availability (and its latency) for a
        // form nothing here ever actually submits.
        setSlots(buildShowreelBookingSlots());
        return;
      }
      const res = await fetch("/api/v1/booking/slots");
      const body = (await res.json()) as { slots?: SlotDto[]; error?: string };
      if (body.error) throw new Error(body.error);
      setSlots(body.slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }

  useEffect(() => {
    void loadSlots();
  }, []);

  // Refetched whenever the resolved service changes — eligibility is
  // per-service, so a doctor list fetched for the last service would be
  // silently wrong for this one. Skipped entirely in showreel mode: the
  // demo's slots carry no doctor_id (buildShowreelBookingSlots predates
  // this feature), so there is nothing real to offer, and nothing in the
  // scripted showreel flow ever depends on a doctor being picked.
  useEffect(() => {
    // Nothing to fetch — doctors already starts at [], which is exactly
    // what showreel mode wants (the section stays hidden), so there is
    // nothing to reset here.
    if (showreel) return;
    let alive = true;
    setDoctorsLoading(true);
    (async () => {
      try {
        const params = resolvedServiceId
          ? `?service_id=${encodeURIComponent(resolvedServiceId)}`
          : "";
        const res = await fetch(`/api/v1/booking/doctors${params}`);
        const body = (await res.json()) as {
          doctors?: DoctorOption[];
          error?: string;
        };
        if (!alive) return;
        if (body.error) throw new Error(body.error);
        setDoctors(body.doctors ?? []);
      } catch {
        if (alive) setDoctors([]);
      } finally {
        if (alive) setDoctorsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [resolvedServiceId, showreel]);

  useBookingFormShowreel({
    enabled: showreel,
    slots,
    serviceOptions: [...ourServices, ...laserServices].map((s) => ({
      id: s.id,
      title: s.title,
    })),
    setSlots,
    setSelectedDate,
    setSelectedSlotId,
    setSuccess,
    setError,
    setName,
    setPhone,
    setEmail,
    setServiceId,
  });

  // No preference (selectedDoctorId === "") shows every doctor's times
  // together, unfiltered — the existing calendar view, unchanged. Picking a
  // specific doctor narrows to just theirs. Either way the doctor is
  // already correct server-side (a slot carries its own doctor_id), this
  // is purely which times the patient sees.
  const doctorFilteredSlots = useMemo(
    () =>
      selectedDoctorId
        ? slots.filter((slot) => slot.doctor_id === selectedDoctorId)
        : slots,
    [slots, selectedDoctorId],
  );

  const dates = useMemo((): BookingDateOption[] => {
    const byDay = new Map<string, BookingDateOption>();
    for (const slot of doctorFilteredSlots) {
      const day = dayKey(slot.starts_at);
      const existing = byDay.get(day);
      if (existing) {
        if (slot.status === "open") existing.hasOpen = true;
        continue;
      }
      const d = new Date(slot.starts_at);
      byDay.set(day, {
        value: day,
        label: d.toLocaleDateString(locale, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        weekday: d.toLocaleDateString(locale, { weekday: "short" }),
        day: d.toLocaleDateString(locale, { day: "numeric" }),
        hasOpen: slot.status === "open",
      });
    }
    return [...byDay.values()];
  }, [doctorFilteredSlots, locale]);

  const daySlots = useMemo(
    () =>
      doctorFilteredSlots.filter((slot) => dayKey(slot.starts_at) === selectedDate),
    [doctorFilteredSlots, selectedDate],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Showreel first — scripted click must not hit live field validation.
    if (document.documentElement.dataset.showreelDemo === "1") {
      setSuccess(true);
      setError(null);
      return;
    }

    const service =
      services.find((s) => s.id === serviceId) ??
      (serviceId === "consultation" ? null : undefined);
    if (service === undefined && serviceId !== "consultation") {
      setError(t("bookingError"));
      return;
    }
    if (!name.trim() || !phone.trim() || !selectedSlotId) {
      setError(t("bookingError"));
      return;
    }
    const selected = slots.find((slot) => slot.id === selectedSlotId);
    if (!selected || selected.status !== "open") {
      setError(t("bookingSlotTaken"));
      void loadSlots();
      setSelectedSlotId("");
      return;
    }

    setPending(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/v1/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_id: selectedSlotId,
          patient_name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          service_id: service?.id ?? null,
          service_label: service?.title ?? "General consultation",
          // The slot's own doctor, not necessarily selectedDoctorId — with
          // "no preference" a patient can still click any doctor's time
          // from the unfiltered list, and that's who this booking is with.
          doctor_id: selected.doctor_id ?? null,
          notes: String(
            new FormData(event.currentTarget).get("notes") || "",
          ).trim(),
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        if (res.status === 409) {
          // Two different 409s share this status: the plain race (someone
          // else took the slot) and the doctor-mismatch guard above. The
          // server's own message already says which one plainly — prefer
          // it when present, falling back to the generic translated copy.
          setError(body.error || t("bookingSlotTaken"));
          await loadSlots();
          setSelectedSlotId("");
          return;
        }
        throw new Error(body.error ?? t("bookingError"));
      }
      setSuccess(true);
      setSlots((prev) =>
        prev.map((slot) =>
          slot.id === selectedSlotId
            ? { ...slot, status: "booked" as const }
            : slot,
        ),
      );
      setSelectedSlotId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("bookingError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      id="booking-form"
      data-showreel-action="booking-form"
      className="space-y-6"
      onSubmit={(e) => void onSubmit(e)}
      noValidate
    >
      <div>
        <h3 className="text-2xl font-semibold text-[#0f2744]">
          {t("bookingTitle")}
        </h3>
        <p className="mt-2 text-sm text-[#6b7280]">{t("bookingIntro")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm text-[#0f2744]">
          <span>{t("bookingName")}</span>
          <input
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-showreel-action="booking-name"
            placeholder={t("bookingNamePlaceholder")}
            className="rounded-[16px] border border-[#e6e8ec] px-4 py-3"
          />
        </label>
        <label className="grid gap-2 text-sm text-[#0f2744]">
          <span>{t("bookingPhone")}</span>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            data-showreel-action="booking-phone"
            placeholder={t("bookingPhonePlaceholder")}
            className="rounded-[16px] border border-[#e6e8ec] px-4 py-3"
          />
          <span className="text-xs text-[#6b7280]">{t("bookingPhoneHint")}</span>
        </label>
        <label className="grid gap-2 text-sm text-[#0f2744]">
          <span>{t("bookingEmail")}</span>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-showreel-action="booking-email"
            placeholder={t("bookingEmailPlaceholder")}
            className="rounded-[16px] border border-[#e6e8ec] px-4 py-3"
          />
        </label>
        <label className="grid gap-2 text-sm text-[#0f2744]">
          <span>{t("bookingService")}</span>
          <select
            name="service"
            required
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            data-showreel-action="booking-service"
            className="rounded-[16px] border border-[#e6e8ec] px-4 py-3"
          >
            <option value="">{t("bookingServicePlaceholder")}</option>
            <option value="consultation">{t("bookingServiceConsult")}</option>
            {ourServices.length > 0 ? (
              <optgroup label={t("serviceKindOurServices")}>
                {ourServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {pickLocalized(locale, service.title, service.title_ar)}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {laserServices.length > 0 ? (
              <optgroup label={t("serviceKindLaser")}>
                {laserServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {pickLocalized(locale, service.title, service.title_ar)}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </label>
      </div>

      {/* Service first, doctor second — the step order the plan settled on.
          The fetch above still runs regardless of whether a service is
          picked (so the list is warm the moment it's needed); this just
          keeps it out of view until there's a service to show it for. */}
      {!serviceId ? null : doctorsLoading ? (
        <p className="text-sm text-[#6b7280]">{t("bookingDoctorLoading")}</p>
      ) : doctors.length === 0 ? (
        // Only worth telling the patient when a real, restricted service is
        // the reason — before any service is chosen (or for an unrestricted
        // one) an empty list here just means "nothing to narrow by yet",
        // not "nobody can see you", so stay silent rather than alarm them.
        resolvedServiceId ? (
          <p className="text-sm text-red-600" role="alert">
            {t("bookingDoctorNoneAvailable")}
          </p>
        ) : null
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <span className="sm:col-span-2 text-sm text-[#0f2744]">
            {t("bookingDoctor")}
          </span>
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-[16px] border px-4 py-3 text-sm transition-colors ${
              selectedDoctorId === ""
                ? "border-[#0f2744] bg-[#0f2744] text-white"
                : "border-[#e6e8ec] text-[#0f2744] hover:border-[#0f2744]/40"
            }`}
          >
            <input
              type="radio"
              name="doctor"
              className="sr-only"
              checked={selectedDoctorId === ""}
              onChange={() => {
                setSelectedDoctorId("");
                setSelectedDate("");
                setSelectedSlotId("");
              }}
            />
            {t("bookingDoctorAny")}
          </label>
          {doctors.map((doctor) => {
            const selected = selectedDoctorId === doctor.id;
            return (
              <label
                key={doctor.id}
                className={`flex cursor-pointer flex-col gap-0.5 rounded-[16px] border px-4 py-3 text-sm transition-colors ${
                  selected
                    ? "border-[#0f2744] bg-[#0f2744] text-white"
                    : "border-[#e6e8ec] text-[#0f2744] hover:border-[#0f2744]/40"
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="doctor"
                    className="sr-only"
                    checked={selected}
                    onChange={() => {
                      setSelectedDoctorId(doctor.id);
                      setSelectedDate("");
                      setSelectedSlotId("");
                    }}
                  />
                  <span className="font-medium">
                    {doctor.displayName ?? doctor.id}
                  </span>
                </span>
                {doctor.specialty ? (
                  <span
                    className={
                      selected ? "text-white/80" : "text-[#6b7280]"
                    }
                  >
                    {doctor.specialty}
                  </span>
                ) : null}
                <span className={selected ? "text-white/80" : "text-[#6b7280]"}>
                  {doctor.nextSlot
                    ? t("bookingDoctorNextAvailable").replace(
                        "{when}",
                        new Date(doctor.nextSlot.startsAt).toLocaleString(
                          locale,
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        ),
                      )
                    : t("bookingDoctorFullyBooked")}
                </span>
              </label>
            );
          })}
        </div>
      )}

      <BookingSchedulePicker
        dates={dates}
        selectedDate={selectedDate}
        onSelectDate={(value) => {
          setSelectedDate(value);
          setSelectedSlotId("");
        }}
        daySlots={daySlots}
        selectedSlotId={selectedSlotId}
        onSelectSlot={setSelectedSlotId}
        slotsLoading={slotsLoading}
        locale={locale}
        labels={{
          date: t("bookingDate"),
          time: t("bookingTime"),
          hint: t("bookingTimeHint"),
          loading: t("bookingDatesLoading"),
          noDates: t("bookingNoDates"),
          pickDate: t("bookingPickDateFirst"),
          noTimes: t("bookingNoTimes"),
          taken: t("bookingSlotTakenLabel"),
          full: t("bookingDayFull"),
        }}
      />
      <input type="hidden" name="slot_id" value={selectedSlotId} required />
      <input type="hidden" name="date" value={selectedDate} required />

      <label className="grid gap-2 text-sm text-[#0f2744]">
        <span>{t("bookingNotes")}</span>
        <textarea
          name="notes"
          rows={3}
          placeholder={t("bookingNotesPlaceholder")}
          className="rounded-[16px] border border-[#e6e8ec] px-4 py-3"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <DentalButton
          type="submit"
          disabled={pending}
          data-showreel-action="booking-submit"
        >
          {pending ? t("bookingPending") : t("bookingSubmit")}
        </DentalButton>
        <DentalButton href="https://wa.me/201111922252" variant="secondary">
          {t("bookingWhatsapp")}
        </DentalButton>
      </div>

      {success ? (
        <p
          id="booking-success"
          data-showreel-action="booking-success"
          className="text-sm text-green-700"
          role="status"
        >
          {t("bookingSuccess")}
        </p>
      ) : null}
      {error ? (
        <p id="booking-error" className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
