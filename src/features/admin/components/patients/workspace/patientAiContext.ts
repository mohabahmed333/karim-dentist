export type PatientAiContextPayload = {
  patientName: string;
  phone: string;
  email: string | null;
  visits: { startsAt: string; status: string; serviceLabel: string }[];
  treatments: {
    toothFdi: string | null;
    toothName: string;
    cdtCode: string | null;
    feeAmount: number;
    severity: string;
    status: string;
    title: string;
    description: string;
    recommendation: string;
    appointment?: {
      startsAt: string;
      status: string;
      serviceLabel: string;
    } | null;
    attachments: { fileName: string; kind: string; fileUrl: string }[];
  }[];
  imaging: {
    title: string;
    kind: string;
    toothFdi: string | null;
    fileName: string;
    fileUrl: string;
  }[];
  toothNotes: { toothFdi: string; body: string }[];
  clinicalNotes: { title: string; body: string }[];
  services: { label: string }[];
  imageUrls: string[];
};

export function formatPatientAiContext(ctx: PatientAiContextPayload): string {
  const visitLines = ctx.visits
    .slice(-12)
    .map((v) => `${v.startsAt} · ${v.status} · ${v.serviceLabel}`)
    .join("\n");
  const txLines = ctx.treatments
    .slice(0, 40)
    .map((t) => {
      const atts = t.attachments
        .map((a) => `${a.kind}:${a.fileName}`)
        .join(", ");
      const appt = t.appointment
        ? ` · booked ${t.appointment.startsAt} (${t.appointment.status}) ${t.appointment.serviceLabel}`
        : " · not booked";
      return `#${t.toothFdi ?? "—"} ${t.toothName} · ${t.cdtCode ?? "—"} · ${t.severity} · ${t.status} · EGP ${t.feeAmount} · ${t.title}${appt}${atts ? ` · files[${atts}]` : ""}`;
    })
    .join("\n");
  const imgLines = ctx.imaging
    .slice(0, 30)
    .map(
      (i) =>
        `${i.kind} · #${i.toothFdi ?? "—"} · ${i.title} · ${i.fileName} · ${i.fileUrl}`,
    )
    .join("\n");
  const noteLines = ctx.toothNotes
    .slice(0, 40)
    .map((n) => `#${n.toothFdi}: ${n.body.slice(0, 240)}`)
    .join("\n");
  const clinicalLines = ctx.clinicalNotes
    .slice(0, 20)
    .map((n) => `${n.title}: ${n.body.slice(0, 240)}`)
    .join("\n");
  const serviceLines = ctx.services
    .slice(0, 40)
    .map((s) => s.label)
    .join(", ");
  const pasted = ctx.imageUrls.slice(0, 6).join("\n");

  return [
    `Patient: ${ctx.patientName} · ${ctx.phone}${ctx.email ? ` · ${ctx.email}` : ""}`,
    "Visits:",
    visitLines || "(none)",
    "Required treatments (all teeth):",
    txLines || "(none)",
    "Imaging files:",
    imgLines || "(none)",
    "Tooth notes:",
    noteLines || "(none)",
    "Clinical notes:",
    clinicalLines || "(none)",
    `Clinic services: ${serviceLines || "(none)"}`,
    "Images attached to this chat turn:",
    pasted || "(none)",
  ].join("\n");
}
