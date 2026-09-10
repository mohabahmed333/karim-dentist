"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import { RESERVATION_MODAL_FIXTURE } from "@/features/portfolio/showreel/product-scenes/fixtures/reservationFixtures";
import {
  SHOWREEL_RESERVATION_EVENT,
  type ShowreelReservationDetail,
} from "@/features/portfolio/showreel/product-scenes/showreelReservationEvents";
import type { ReservationFormValues } from "@/services/reservations/schemas";

type Args = {
  enabled: boolean;
  setForm: Dispatch<SetStateAction<ReservationFormValues>>;
};

/** Scripted fills for the showreel's "book from the calendar" beat. */
export function useReservationFormShowreel({ enabled, setForm }: Args) {
  useEffect(() => {
    if (!enabled) return;

    function onEvent(event: Event) {
      const detail = (event as CustomEvent<ShowreelReservationDetail>).detail;
      if (!detail || detail.type !== "fill") return;
      if (detail.field === "patient_name") {
        setForm((prev) => ({
          ...prev,
          patient_name: RESERVATION_MODAL_FIXTURE.patientName,
        }));
      }
      if (detail.field === "phone") {
        setForm((prev) => ({
          ...prev,
          phone: RESERVATION_MODAL_FIXTURE.phone,
        }));
      }
    }

    window.addEventListener(SHOWREEL_RESERVATION_EVENT, onEvent);
    return () =>
      window.removeEventListener(SHOWREEL_RESERVATION_EVENT, onEvent);
  }, [enabled, setForm]);
}
