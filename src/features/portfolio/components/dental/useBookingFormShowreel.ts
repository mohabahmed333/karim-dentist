"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import { buildShowreelBookingSlots } from "@/features/portfolio/showreel/product-scenes/buildShowreelBookingSlots";
import { SITE_TO_CHAT_FIXTURE } from "@/features/portfolio/showreel/product-scenes/fixtures/siteToChatFixtures";
import {
  SHOWREEL_SITE_TO_CHAT_EVENT,
  type ShowreelSiteToChatDetail,
} from "@/features/portfolio/showreel/product-scenes/showreelSiteToChatEvents";

type SlotDto = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: "open" | "booked";
};

type Args = {
  enabled: boolean;
  slots: SlotDto[];
  serviceOptions: { id: string; title: string }[];
  setSlots: Dispatch<SetStateAction<SlotDto[]>>;
  setSelectedDate: Dispatch<SetStateAction<string>>;
  setSelectedSlotId: Dispatch<SetStateAction<string>>;
  setSuccess: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setName: Dispatch<SetStateAction<string>>;
  setPhone: Dispatch<SetStateAction<string>>;
  setEmail: Dispatch<SetStateAction<string>>;
  setServiceId: Dispatch<SetStateAction<string>>;
};

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Scripted fills for showreel site-to-chat booking form. */
export function useBookingFormShowreel(args: Args) {
  const {
    enabled,
    slots,
    serviceOptions,
    setSlots,
    setSelectedDate,
    setSelectedSlotId,
    setSuccess,
    setError,
    setName,
    setPhone,
    setEmail,
    setServiceId,
  } = args;

  useEffect(() => {
    if (!enabled) return;
    const fx = SITE_TO_CHAT_FIXTURE;

    function ensureList(): SlotDto[] {
      if (slots.some((s) => s.status === "open")) return slots;
      const built = buildShowreelBookingSlots();
      setSlots(built);
      return built;
    }

    function applySlot(list: SlotDto[]) {
      const first = list.find((s) => s.status === "open");
      if (!first) return;
      setSelectedDate(dayKey(first.starts_at));
      setSelectedSlotId(first.id);
    }

    function fillPatient() {
      setName(fx.patientName);
      setPhone(fx.phone);
      setEmail(fx.email);
      const whitening = serviceOptions.find((s) => /whiten/i.test(s.title));
      setServiceId(whitening?.id ?? "consultation");
      applySlot(ensureList());
    }

    function onEvent(event: Event) {
      const detail = (event as CustomEvent<ShowreelSiteToChatDetail>).detail;
      if (!detail) return;
      if (detail.type === "fill") {
        if (detail.field === "name") setName(fx.patientName);
        if (detail.field === "phone") setPhone(fx.phone);
        if (detail.field === "service") {
          setEmail(fx.email);
          const whitening = serviceOptions.find((s) => /whiten/i.test(s.title));
          setServiceId(whitening?.id ?? "consultation");
        }
        if (detail.field === "slot") applySlot(ensureList());
        return;
      }
      if (detail.type === "submit") {
        fillPatient();
        setError(null);
        setSuccess(true);
      }
    }

    window.addEventListener(SHOWREEL_SITE_TO_CHAT_EVENT, onEvent);
    return () => window.removeEventListener(SHOWREEL_SITE_TO_CHAT_EVENT, onEvent);
  }, [
    enabled,
    serviceOptions,
    setEmail,
    setError,
    setName,
    setPhone,
    setSelectedDate,
    setSelectedSlotId,
    setServiceId,
    setSlots,
    setSuccess,
    slots,
  ]);
}
