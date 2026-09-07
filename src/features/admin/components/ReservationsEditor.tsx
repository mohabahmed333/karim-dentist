"use client";

import { ReservationsPageView } from "@/features/admin/components/reservations/ReservationsPageView";
import type { Reservation } from "@/services/reservations/types";
import type { Service } from "@/services/services/types";

/** @deprecated Prefer ReservationsPageView — kept for compatibility. */
export function ReservationsEditor({
  initial,
  services,
}: {
  initial: Reservation[];
  services: Service[];
}) {
  return (
    <ReservationsPageView reservations={initial} services={services} />
  );
}
