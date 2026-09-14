/** Fixed swatches for doctor calendar colors — keeps colors distinct across doctors. */
export const DOCTOR_COLOR_PALETTE = [
  "#7c5cff",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#6366f1",
] as const;

/** Deterministic swatch for a doctor with no chosen calendar_color, so the calendar stays distinguishable. */
export function fallbackDoctorColor(doctorId: string): string {
  let hash = 0;
  for (let i = 0; i < doctorId.length; i += 1) {
    hash = (hash * 31 + doctorId.charCodeAt(i)) >>> 0;
  }
  return DOCTOR_COLOR_PALETTE[hash % DOCTOR_COLOR_PALETTE.length];
}
