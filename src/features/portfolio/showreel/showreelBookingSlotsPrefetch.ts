type ShowreelBookingSlotDto = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: "open" | "booked";
};

type ShowreelBookingSlotsResponse = {
  slots?: ShowreelBookingSlotDto[];
  error?: string;
};

let pending: Promise<ShowreelBookingSlotsResponse> | null = null;

/**
 * Warm /api/v1/booking/slots ahead of the site-to-chat scene, so its
 * BookingForm mount (which only happens once that scene activates) doesn't
 * show a loading flash. Safe to call more than once — only the first call
 * issues a request; later calls reuse the same in-flight/resolved promise.
 */
export function prefetchShowreelBookingSlots(): void {
  if (pending) return;
  pending = fetch("/api/v1/booking/slots")
    .then((res) => res.json() as Promise<ShowreelBookingSlotsResponse>)
    .catch(() => ({ slots: [] }) as ShowreelBookingSlotsResponse);
}

/** The prefetched slots promise, if prefetchShowreelBookingSlots() has run. */
export function getShowreelBookingSlotsPrefetch():
  | Promise<ShowreelBookingSlotsResponse>
  | null {
  return pending;
}
