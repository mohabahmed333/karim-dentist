"use client";

import type { TreatmentAiDraft } from "@/services/ai_groq";
import type { TreatmentAppointment } from "@/services/patient_treatments";
import { formatAppointmentLabel } from "@/services/cdt";
import { CHAT_BODY, CHAT_META } from "./chatSkin";

type Note = { id: string; body: string };
type Treatment = {
  id: string;
  cdtCode: string | null;
  feeAmount: number;
  severity: string;
  title: string;
  status: string;
  appointment: TreatmentAppointment | null;
};

type Props = {
  toothLabel: string;
  draft: TreatmentAiDraft | null;
  treatments: Treatment[];
  notes: Note[];
};

export function ChatDetailsTab({
  toothLabel,
  draft,
  treatments,
  notes,
}: Props) {
  return (
    <div className={`min-h-0 flex-1 overflow-y-auto ${CHAT_BODY} p-4`}>
      <section className="mb-5">
        <p className={`mb-2 text-[11px] font-medium tracking-wide uppercase ${CHAT_META}`}>
          Case · {toothLabel}
        </p>
        {draft?.cdt_code || draft?.ai_title ? (
          <dl className="space-y-1.5 rounded-2xl bg-[#F1F3F5] px-3 py-2.5 text-[12px]">
            <Row label="CDT" value={draft.cdt_code || "—"} />
            <Row
              label="Fee"
              value={draft.fee_amount ? `EGP ${draft.fee_amount}` : "—"}
            />
            <Row label="Severity" value={draft.severity || "—"} />
            <Row label="Title" value={draft.ai_title || "—"} />
            <Row label="Findings" value={strip(draft.ai_description) || "—"} />
            <Row label="Plan" value={strip(draft.ai_recommendation) || "—"} />
          </dl>
        ) : (
          <p className={`rounded-2xl bg-[#F1F3F5] px-3 py-3 text-[12px] ${CHAT_META}`}>
            No AI draft yet. Chat to collect case details.
          </p>
        )}
      </section>

      <section className="mb-5">
        <p className={`mb-2 text-[11px] font-medium tracking-wide uppercase ${CHAT_META}`}>
          Required treatments
        </p>
        {treatments.length === 0 ? (
          <p className={`rounded-2xl bg-[#F1F3F5] px-3 py-3 text-[12px] ${CHAT_META}`}>
            None for this tooth.
          </p>
        ) : (
          <ul className="space-y-2">
            {treatments.map((row) => (
              <li
                key={row.id}
                className="rounded-2xl bg-[#F1F3F5] px-3 py-2.5 text-[12px] text-[#111111]"
              >
                <p className="font-medium">
                  {row.title || row.cdtCode || "Treatment"}
                </p>
                <p className={`text-[11px] ${CHAT_META}`}>
                  {row.cdtCode ?? "—"} · {row.severity} · EGP {row.feeAmount} ·{" "}
                  {row.status}
                </p>
                {row.appointment ? (
                  <p className="mt-1 text-[11px] font-medium text-[#166534]">
                    Booked · {formatAppointmentLabel(row.appointment.startsAt)} ·{" "}
                    {row.appointment.status}
                  </p>
                ) : (
                  <p className={`mt-1 text-[11px] ${CHAT_META}`}>Not booked</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className={`mb-2 text-[11px] font-medium tracking-wide uppercase ${CHAT_META}`}>
          Tooth notes
        </p>
        {notes.length === 0 ? (
          <p className={`rounded-2xl bg-[#F1F3F5] px-3 py-3 text-[12px] ${CHAT_META}`}>
            No notes yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {notes.map((note) => (
              <li
                key={note.id}
                className="rounded-2xl bg-[#F1F3F5] px-3 py-2.5 text-[12px] whitespace-pre-wrap text-[#111111]"
              >
                {note.body}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className={`w-20 shrink-0 font-medium ${CHAT_META}`}>{label}</dt>
      <dd className="min-w-0 flex-1 text-[#111111]">{value}</dd>
    </div>
  );
}

function strip(html?: string): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
