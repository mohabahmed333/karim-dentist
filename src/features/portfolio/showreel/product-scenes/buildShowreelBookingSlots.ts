type SlotDto = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: "open" | "booked";
};

/** Deterministic open slots when live API days are all FULL (showreel only). */
export function buildShowreelBookingSlots(now = new Date()): SlotDto[] {
  const slots: SlotDto[] = [];
  for (let day = 1; day <= 5; day += 1) {
    for (const hour of [10, 11, 14, 16]) {
      const start = new Date(now);
      start.setDate(start.getDate() + day);
      start.setHours(hour, 30, 0, 0);
      if (start.getDay() === 5) continue; // skip Friday
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 60);
      slots.push({
        id: `showreel-slot-${day}-${hour}`,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        status: "open",
      });
    }
  }
  return slots;
}

export function ensureOpenBookingSlots(slots: SlotDto[]): SlotDto[] {
  if (slots.some((s) => s.status === "open")) return slots;
  return buildShowreelBookingSlots();
}
