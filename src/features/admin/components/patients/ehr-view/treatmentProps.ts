import type { TreatmentItem, TreatmentStatus } from "@/services/patient_treatments";

export function treatmentProgressPercent(status: TreatmentStatus): number {
  if (status === "done") return 100;
  if (status === "scheduled") return 55;
  return 20;
}

export type TreatmentPropKind =
  | "progress"
  | "description"
  | "recommendation"
  | "last"
  | "appointment"
  | "cdt"
  | "fee"
  | "attachment";

export type TreatmentPropNode = {
  id: string;
  kind: TreatmentPropKind;
  label: string;
  value: string;
  meta?: string;
  url?: string;
  progress?: number;
};

function plain(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function plainDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getUTCFullYear()}`;
}

export function buildTreatmentPropNodes(
  treatment: TreatmentItem,
): TreatmentPropNode[] {
  const nodes: TreatmentPropNode[] = [];
  const progress = treatmentProgressPercent(treatment.status);

  nodes.push({
    id: `prop-${treatment.id}-progress`,
    kind: "progress",
    label: "Progress",
    value: `${progress}%`,
    meta: treatment.status,
    progress,
  });

  if (treatment.aiInsight?.description?.trim()) {
    nodes.push({
      id: `prop-${treatment.id}-desc`,
      kind: "description",
      label: "Description",
      value: plain(treatment.aiInsight.description),
      meta: treatment.aiInsight.confidence
        ? `${treatment.aiInsight.confidence}% confidence`
        : undefined,
    });
  }

  if (treatment.aiInsight?.recommendation?.trim()) {
    nodes.push({
      id: `prop-${treatment.id}-rec`,
      kind: "recommendation",
      label: "Recommendation",
      value: plain(treatment.aiInsight.recommendation),
    });
  }

  const last = plain(treatment.lastTreatment);
  if (last) {
    nodes.push({
      id: `prop-${treatment.id}-last`,
      kind: "last",
      label: "Last treatment",
      value: last,
    });
  }

  if (treatment.appointment) {
    nodes.push({
      id: `prop-${treatment.id}-appt`,
      kind: "appointment",
      label: "Appointment",
      value: treatment.appointment.serviceLabel,
      meta: `${plainDate(treatment.appointment.startsAt)} · ${treatment.appointment.status}`,
    });
  }

  if (treatment.cdtCode) {
    nodes.push({
      id: `prop-${treatment.id}-cdt`,
      kind: "cdt",
      label: "CDT",
      value: treatment.cdtCode,
      meta: treatment.phase,
    });
  }

  if (treatment.feeAmount > 0) {
    nodes.push({
      id: `prop-${treatment.id}-fee`,
      kind: "fee",
      label: "Fee",
      value: `${treatment.feeAmount.toLocaleString()} EGP`,
    });
  }

  treatment.attachments.forEach((a, i) => {
    nodes.push({
      id: `prop-${treatment.id}-att-${a.id}`,
      kind: "attachment",
      label: a.kind === "xray" ? "X-ray" : a.kind === "image" ? "Image" : "File",
      value: a.file_name || `Attachment ${i + 1}`,
      url: a.file_url,
      meta: a.kind,
    });
  });

  return nodes;
}
