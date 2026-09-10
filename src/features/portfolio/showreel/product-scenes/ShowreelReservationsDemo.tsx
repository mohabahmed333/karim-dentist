"use client";

import { useMemo } from "react";
import { ReservationsPageView } from "@/features/admin/components/reservations/ReservationsPageView";
import {
  buildShowreelReservations,
  buildShowreelServices,
} from "./buildShowreelReservations";

/** Real reservations page UI (calendar + rail + table) with offline fixtures. */
export function ShowreelReservationsDemo() {
  const reservations = useMemo(() => buildShowreelReservations(), []);
  const services = useMemo(() => buildShowreelServices(), []);

  return (
    <div data-showreel-action="demo-page-reservations">
      <ReservationsPageView
        reservations={reservations}
        tableRows={reservations}
        tableTotal={reservations.length}
        services={services}
      />
    </div>
  );
}
