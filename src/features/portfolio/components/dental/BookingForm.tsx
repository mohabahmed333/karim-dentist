"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Tables } from "@/lib/supabase/database.types";
import { pickLocalized, useLocale, useTranslations } from "@/lib/i18n";
import { hasVisibleServiceTitle } from "@/features/portfolio/lib/serviceKindGroups";
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

  useEffect(() => {
    setShowreel(document.documentElement.dataset.showreelDemo === "1");
  }, []);

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
      const isShowreel = document.documentElement.dataset.showreelDemo === "1";
      let body: { slots?: SlotDto[]; error?: string };
      if (isShowreel) {
        // The site-to-chat scene primes this before it ever mounts
        // BookingForm (see ShowreelPrefetch's prefetchBookingSlots), so the
        // date picker doesn't show a loading flash the moment it appears.
        // Falls back to a normal fetch if nothing was primed (e.g. this
        // route loaded on its own, outside the full deck).
        const { getShowreelBookingSlotsPrefetch } = await import(
          "@/features/portfolio/showreel/showreelBookingSlotsPrefetch"
        );
        const prefetched = getShowreelBookingSlotsPrefetch();
        body = prefetched
          ? await prefetched
          : ((await (await fetch("/api/v1/booking/slots")).json()) as {
              slots?: SlotDto[];
              error?: string;
            });
      } else {
        const res = await fetch("/api/v1/booking/slots");
        body = (await res.json()) as { slots?: SlotDto[]; error?: string };
      }
      if (body.error) throw new Error(body.error);
      let next = body.slots ?? [];
      if (isShowreel) {
        const { ensureOpenBookingSlots } = await import(
          "@/features/portfolio/showreel/product-scenes/buildShowreelBookingSlots"
        );
        next = ensureOpenBookingSlots(next);
      }
      setSlots(next);
    } catch {
      if (document.documentElement.dataset.showreelDemo === "1") {
        const { buildShowreelBookingSlots } = await import(
          "@/features/portfolio/showreel/product-scenes/buildShowreelBookingSlots"
        );
        setSlots(buildShowreelBookingSlots());
      } else {
        setSlots([]);
      }
    } finally {
      setSlotsLoading(false);
    }
  }

  useEffect(() => {
    void loadSlots();
  }, []);

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

  const dates = useMemo((): BookingDateOption[] => {
    const byDay = new Map<string, BookingDateOption>();
    for (const slot of slots) {
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
  }, [slots, locale]);

  const daySlots = useMemo(
    () => slots.filter((slot) => dayKey(slot.starts_at) === selectedDate),
    [slots, selectedDate],
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
          notes: String(
            new FormData(event.currentTarget).get("notes") || "",
          ).trim(),
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        if (res.status === 409) {
          setError(t("bookingSlotTaken"));
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
