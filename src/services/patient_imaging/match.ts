import { fdiForUniversalAdult } from "@/services/notation";
import type { PatientImaging } from "./types";

export function imagingForFdi(
  items: PatientImaging[],
  fdi: string,
): PatientImaging[] {
  return items
    .filter((item) => {
      if (item.tooth_fdi === fdi) return true;
      if (
        item.tooth_number != null &&
        fdiForUniversalAdult(item.tooth_number) === fdi
      ) {
        return true;
      }
      return false;
    })
    .slice()
    .sort((a, b) => {
      const aTime = Date.parse(a.taken_at ?? a.created_at);
      const bTime = Date.parse(b.taken_at ?? b.created_at);
      return bTime - aTime;
    });
}
