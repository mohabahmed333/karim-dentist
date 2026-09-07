"use client";

import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { toothName } from "@/services/patient_tooth_findings/fdi";
import type { ClinicalNote } from "@/services/clinical_notes";
import {
  imagingForFdi,
  type PatientImaging,
} from "@/services/patient_imaging";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { Service } from "@/services/services/types";
import type { TreatmentAiDraft } from "@/services/ai_groq";
import type { usePatientTreatments } from "../usePatientTreatments";
import type { PendingFile } from "../treatments/TreatmentEditorForm";
import { AiTreatmentChatPanel } from "./AiTreatmentChatPanel";
import { TreatmentWizard } from "./TreatmentWizard";
import {
  draftToUpsert,
  findExistingTreatmentForDraft,
  wizardDraftFromAi,
  type WizardDraft,
  type WizardLaunch,
} from "./wizardModel";
import type { PatientAiContextPayload } from "./patientAiContext";
import {
  createReservation,
  updateReservation,
} from "@/services/reservations/mutations";
import {
  bookOpenSlotMatchingStartsAt,
  releaseAppointmentSlot,
} from "@/services/clinic_schedule";

type Chart = ReturnType<typeof usePatientTreatments>;

type Props = {
  group: PatientGroup;
  selectedFdi: string | null;
  chart: Chart;
  imaging: PatientImaging[];
  toothNotes: PatientToothNote[];
  clinicalNotes: ClinicalNote[];
  services: Service[];
  wizardLaunch: WizardLaunch | null;
  onWizardLaunchApplied: () => void;
  onApplyAiDraft: (
    draft: TreatmentAiDraft,
    existingTreatmentId?: string | null,
  ) => void;
};

export function WorkspaceTreatmentsPane({
  group,
  selectedFdi,
  chart,
  imaging,
  toothNotes,
  clinicalNotes,
  services,
  wizardLaunch,
  onWizardLaunchApplied,
  onApplyAiDraft,
}: Props) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardSeed, setWizardSeed] = useState<WizardDraft | null>(null);
  const [wizardTreatmentId, setWizardTreatmentId] = useState<
    string | "new" | null
  >(null);

  useEffect(() => {
    setWizardOpen(false);
    setWizardSeed(null);
    setWizardTreatmentId(null);
    chart.closeEditor();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on tooth change only
  }, [selectedFdi]);

  useEffect(() => {
    if (!wizardLaunch || !selectedFdi) return;
    // Avoid remounting/re-opening when the same treatment is launched again
    if (
      wizardOpen &&
      wizardTreatmentId != null &&
      wizardTreatmentId === wizardLaunch.treatmentId
    ) {
      onWizardLaunchApplied();
      return;
    }
    setWizardSeed(wizardLaunch.draft);
    setWizardTreatmentId(wizardLaunch.treatmentId);
    if (wizardLaunch.treatmentId === "new") {
      chart.openEditor(
        "new",
        {
          tooth_fdi: selectedFdi,
          tooth_name: toothName(selectedFdi),
        },
        "wizard",
      );
    } else {
      chart.openEditor(wizardLaunch.treatmentId, null, "wizard");
    }
    setWizardOpen(true);
    onWizardLaunchApplied();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply once when launch arrives
  }, [wizardLaunch]);

  const name = selectedFdi ? toothName(selectedFdi) : "";

  const patientContext: PatientAiContextPayload = {
    patientName: group.displayName,
    phone: group.phone,
    email: group.email,
    visits: group.visits.slice(-12).map((v) => ({
      startsAt: v.starts_at,
      status: v.status,
      serviceLabel: v.service_label,
    })),
    treatments: chart.items.map((item) => ({
      toothFdi: item.toothFdi,
      toothName: item.toothName,
      cdtCode: item.cdtCode,
      feeAmount: item.feeAmount,
      severity: item.severity,
      status: item.status,
      title: item.aiInsight?.title ?? "",
      description: item.aiInsight?.description ?? "",
      recommendation: item.aiInsight?.recommendation ?? "",
      appointment: item.appointment
        ? {
            startsAt: item.appointment.startsAt,
            status: item.appointment.status,
            serviceLabel: item.appointment.serviceLabel,
          }
        : null,
      attachments: item.attachments.map((a) => ({
        fileName: a.file_name,
        kind: a.kind,
        fileUrl: a.file_url,
      })),
    })),
    imaging: (selectedFdi ? imagingForFdi(imaging, selectedFdi) : []).map(
      (img) => ({
        title: img.title,
        kind: img.kind,
        toothFdi: img.tooth_fdi,
        fileName: img.file_name,
        fileUrl: img.file_url,
      }),
    ),
    toothNotes: toothNotes.map((n) => ({
      toothFdi: n.fdi_number,
      body: n.body,
    })),
    clinicalNotes: clinicalNotes.map((n) => ({
      title: n.category,
      body: n.content,
    })),
    services: services.map((s) => ({ label: s.title })),
    imageUrls: [],
  };

  function closeWizard() {
    setWizardOpen(false);
    setWizardSeed(null);
    setWizardTreatmentId(null);
    chart.closeEditor();
  }

  if (!selectedFdi) {
    return (
      <Shell>
        <p className="m-auto max-w-xs text-center text-sm text-[#94A3B8]">
          Select a tooth on the chart to chart with AI assist.
        </p>
      </Shell>
    );
  }

  if (wizardOpen) {
    const savedRow =
      wizardTreatmentId && wizardTreatmentId !== "new"
        ? chart.items.find((row) => row.id === wizardTreatmentId)
        : undefined;
    const savedAttachments = savedRow?.attachments ?? [];
    return (
      <Shell tone="wizard">
        <TreatmentWizard
          key={`${selectedFdi}-${wizardTreatmentId ?? "new"}`}
          toothFdi={selectedFdi}
          toothName={name}
          pending={chart.pending}
          initialDraft={wizardSeed ?? undefined}
          alreadySaved={wizardTreatmentId !== null && wizardTreatmentId !== "new"}
          existingTreatmentId={
            wizardTreatmentId && wizardTreatmentId !== "new"
              ? wizardTreatmentId
              : null
          }
          existingAppointment={savedRow?.appointment ?? null}
          savedAttachments={savedAttachments}
          onCancel={closeWizard}
          onSave={async (raw, files) => chart.saveTreatment(raw, files)}
          onRemoveSavedAttachment={(id) => void chart.removeAttachment(id)}
          onBook={(id) => {
            const hasAppt = Boolean(
              chart.items.find((row) => row.id === id)?.appointment,
            );
            chart.openBook(id, hasAppt ? "replace" : "book");
            closeWizard();
          }}
          onDone={closeWizard}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <AiTreatmentChatPanel
        key={`${group.patientKey}-${selectedFdi}`}
        patientKey={group.patientKey}
        toothFdi={selectedFdi}
        toothName={name}
        patientName={group.displayName}
        patientPhone={group.phone}
        patientEmail={group.email}
        patientContext={patientContext}
        imaging={dedupeAttachmentSources(
          imagingForFdi(imaging, selectedFdi).map((img) => ({
            id: img.id,
            title: img.title || img.file_name || "Imaging",
            kind: img.kind,
            url: img.file_url,
          })),
          chart.items
            .filter((row) => row.toothFdi === selectedFdi)
            .flatMap((row) =>
              row.attachments.map((a) => ({
                id: a.id,
                title: a.file_name || "Attachment",
                kind: a.kind,
                url: a.file_url,
              })),
            ),
        )}
        toothNotes={toothNotes
          .filter((n) => n.fdi_number === selectedFdi)
          .map((n) => ({ id: n.id, body: n.body }))}
        toothTreatments={chart.items
          .filter((row) => row.toothFdi === selectedFdi)
          .map((row) => ({
            id: row.id,
            cdtCode: row.cdtCode,
            feeAmount: row.feeAmount,
            severity: row.severity,
            title: row.aiInsight?.title ?? "",
            status: row.status,
            appointment: row.appointment ?? null,
          }))}
        existing={chart.items.map((row) => ({
          cdtCode: row.cdtCode,
          feeAmount: row.feeAmount,
          severity: row.severity,
          title: row.aiInsight?.title ?? "",
          status: row.status,
          toothFdi: row.toothFdi,
        }))}
        onApplyDraft={onApplyAiDraft}
        onCreateDraft={async (aiDraft, files: PendingFile[]) => {
          const match = findExistingTreatmentForDraft(
            chart.items,
            selectedFdi,
            aiDraft.cdt_code,
            null,
          );
          if (match) {
            toast.info("This treatment already exists — opening wizard to review");
            onApplyAiDraft(aiDraft, match.id);
            return match.id;
          }
          const wizard = wizardDraftFromAi(selectedFdi, name, aiDraft);
          return chart.createTreatmentFromDraft(draftToUpsert(wizard), files);
        }}
        onBook={(id) => {
          const hasAppt = Boolean(
            chart.items.find((row) => row.id === id)?.appointment,
          );
          chart.openBook(id, hasAppt ? "replace" : "book");
        }}
        onScheduleAt={async (treatmentId, startsAtIso) => {
          const item = chart.items.find((row) => row.id === treatmentId);
          if (!item) throw new Error("Treatment not found");
          const payload = {
            patient_name: group.displayName,
            phone: group.phone,
            email: group.email,
            service_label:
              item.appointment?.serviceLabel ??
              `Treatment: ${item.toothName}`,
            starts_at: startsAtIso,
            notes: item.appointment?.notes ?? "",
            status: "confirmed" as const,
          };
          if (item.reservationId) {
            await releaseAppointmentSlot(item.reservationId);
          }
          const reservation = item.reservationId
            ? await updateReservation(item.reservationId, payload)
            : await createReservation(payload);
          await bookOpenSlotMatchingStartsAt({
            startsAtIso,
            reservationId: reservation.id,
          });
          await chart.afterBooked(treatmentId, reservation);
        }}
      />
    </Shell>
  );
}

function dedupeAttachmentSources(
  primary: { id: string; title: string; kind: string; url: string }[],
  secondary: { id: string; title: string; kind: string; url: string }[],
) {
  const byUrl = new Map<string, (typeof primary)[number]>();
  for (const item of primary) {
    if (item.url) byUrl.set(item.url, item);
  }
  for (const item of secondary) {
    if (item.url && !byUrl.has(item.url)) byUrl.set(item.url, item);
  }
  return [...byUrl.values()];
}

function Shell({
  children,
  tone = "plain",
}: {
  children: ReactNode;
  tone?: "plain" | "wizard";
}) {
  return (
    <div
      className={`flex h-full min-h-0 flex-1 flex-col overflow-hidden ${
        tone === "wizard" ? "bg-[#F8F9FB]" : "bg-transparent"
      }`}
    >
      {children}
    </div>
  );
}
