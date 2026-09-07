export type BookDrawerMode = "book" | "replace";

/** Compact chairside label for a reservation start time. */
export function formatAppointmentLabel(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function bookModeForStatus(
  status: "open" | "scheduled" | "done",
): BookDrawerMode {
  return status === "open" ? "book" : "replace";
}
