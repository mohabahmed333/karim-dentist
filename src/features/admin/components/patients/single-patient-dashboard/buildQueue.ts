import type { PatientImaging } from "@/services/patient_imaging";
import {
  toTreatmentItem,
  type PatientTreatmentRow,
} from "@/services/patient_treatments";
import { toothName } from "@/services/patient_tooth_findings/fdi";
import type { QueueRow } from "./clinicalTypes";

export function buildQueueFromServer(
  rows: PatientTreatmentRow[],
  imaging: PatientImaging[],
): QueueRow[] {
  return rows
    .map((row) => {
      const item = toTreatmentItem(row);
      const fdi = item.toothFdi;
      const imageUrls = imaging
        .filter(
          (img) =>
            (fdi && img.tooth_fdi === fdi) ||
            item.attachments.some((a) => a.imaging_id === img.id),
        )
        .map((img) => img.file_url)
        .slice(0, 2);
      const attachmentUrls = item.attachments
        .filter((a) => a.kind === "image" || a.kind === "xray")
        .map((a) => a.file_url)
        .slice(0, 2);
      return {
        id: item.id,
        toothFdi: fdi,
        toothLabel: fdi ? `${toothName(fdi)} (#${fdi})` : item.toothName,
        cdtCode: item.cdtCode,
        description: item.lastTreatment,
        severity: item.severity,
        status: item.status,
        feeAmount: item.feeAmount,
        imageUrls: imageUrls.length > 0 ? imageUrls : attachmentUrls,
        source: "server" as const,
      };
    })
    .sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "Critical" ? -1 : 1;
      if (a.status !== b.status) {
        const order = { open: 0, scheduled: 1, done: 2 };
        return order[a.status] - order[b.status];
      }
      return 0;
    });
}
