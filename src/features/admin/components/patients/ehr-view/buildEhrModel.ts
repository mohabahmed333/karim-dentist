import type { PatientImaging } from "@/services/patient_imaging";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import type { TreatmentItem } from "@/services/patient_treatments";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import {
  FDI_TO_UNIVERSAL,
  type EhrCondition,
  type EhrMediaPanel,
  type EhrVisit,
} from "./ehr.types";

const DOCTOR = "Dr. Karim Elshibiny";

export function buildEhrModel(
  treatments: TreatmentItem[],
  group: PatientGroup,
  imaging: PatientImaging[],
  notes: PatientToothNote[] = [],
) {
  // Required = open + scheduled (all of them — no cap for the Clinical scene)
  const required = treatments.filter(
    (t) => t.status === "open" || t.status === "scheduled",
  );

  const conditions: EhrCondition[] = required.map((row, i) => {
    const fdi = row.toothFdi ?? "";
    const universal = FDI_TO_UNIVERSAL[fdi] ?? null;
    const scans = row.attachments.filter(
      (a) => a.kind === "xray" || a.kind === "image",
    ).length;
    const noteCount = notes.filter((n) => n.fdi_number === fdi).length;
    const fileNotes = row.attachments.filter((a) => a.kind === "file").length;
    return {
      id: row.id,
      index: i + 1,
      title: `${row.toothName}${fdi ? ` · #${fdi}` : ""}`,
      toothName: row.toothName,
      fdi: fdi || null,
      toothUniversal: universal,
      toothLabel: fdi ? `Tooth #${fdi}` : row.toothName,
      counts: {
        labs: 0,
        scans,
        meds: row.status === "scheduled" ? 1 : 0,
        notes: noteCount + fileNotes + (row.aiInsight ? 1 : 0),
      },
    };
  });

  const visits: EhrVisit[] = group.visits
    .filter((v) => v.status !== "cancelled")
    .slice()
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .map((v) => {
      const starts = new Date(v.starts_at);
      return {
        id: v.id,
        dateLabel: formatDotDate(v.starts_at),
        timeLabel: formatTime(v.starts_at),
        startsAt: v.starts_at,
        year: starts.getFullYear(),
        doctor: DOCTOR,
        serviceLabel: v.service_label || "Visit",
        status: v.status,
        mediaIds: [],
      };
    });

  const media: EhrMediaPanel[] = imaging.slice(0, 4).map((row, i) => {
    const visit = visits[Math.min(i, Math.max(visits.length - 1, 0))];
    const panel: EhrMediaPanel = {
      id: row.id,
      visitId: visit?.id ?? `orphan-${row.id}`,
      label: `Imaging - ${i + 1}`,
      dateLabel: formatDotDate(row.taken_at ?? row.created_at),
      index: i + 1,
      variant: i % 2 === 0 ? "dark" : "light",
      urls: [row.file_url],
    };
    if (visit) visit.mediaIds.push(panel.id);
    return panel;
  });

  if (media.length === 0) {
    treatments.forEach((t, ti) => {
      t.attachments
        .filter((a) => a.kind === "xray" || a.kind === "image")
        .slice(0, 2)
        .forEach((a, ai) => {
          const visit = visits[Math.min(ti, Math.max(visits.length - 1, 0))];
          const panel: EhrMediaPanel = {
            id: a.id,
            visitId: visit?.id ?? `t-${t.id}`,
            label: `Imaging - ${media.length + 1}`,
            dateLabel: formatDotDate(a.created_at),
            index: media.length + 1,
            variant: (media.length + ai) % 2 === 0 ? "dark" : "light",
            urls: [a.file_url],
          };
          if (visit) visit.mediaIds.push(panel.id);
          media.push(panel);
        });
    });
  }

  return { conditions, visits, media };
}

function formatDotDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${period}`;
}
