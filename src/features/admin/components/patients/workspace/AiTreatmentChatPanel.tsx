"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import type { TreatmentAiDraft, TreatmentAiPoll } from "@/services/ai_groq";
import {
  createPatientImaging,
  uploadPatientImagingFile,
} from "@/services/patient_imaging";
import { universalForFdi } from "@/services/notation";
import type { PendingFile } from "../treatments/TreatmentEditorForm";
import {
  ChatAttachmentsTab,
  type ChatAttachmentItem,
} from "./ChatAttachmentsTab";
import { ChatShell } from "@/features/admin/components/chat";
import { ChatComposer } from "./ChatComposer";
import { ChatDetailsTab } from "./ChatDetailsTab";
import {
  ChatPanelHeader,
  type ChatPanelTab,
} from "./ChatPanelHeader";
import { ChatThread } from "./ChatThread";
import { ClientProfileDrawer } from "./ClientProfileDrawer";
import {
  ActionReviewCard,
  type ProposalReviewState,
} from "@/features/admin/components/chat/ActionReviewCard";
import { proposeFromChat } from "@/features/admin/components/chat/proposeFromChat";
import type { ProposedAction } from "@/services/admin_ai";
import {
  createPendingUploads,
  revokePendingUploads,
  type PendingChatUpload,
} from "./chatResources/pendingUpload";
import type { ChatResourceKind } from "./chatResources/kinds";
import {
  clearChatHistory,
  loadChatHistory,
  saveChatHistory,
  type ChatTurn,
} from "./chatHistoryStorage";
import {
  buildRescheduleSlotPoll,
  type ChatSlashCommand,
} from "./chatSlashCommands";
import { RescheduleDatePopover } from "./RescheduleDatePopover";
import type { PatientAiContextPayload } from "./patientAiContext";
import { formatPatientAiContext } from "./patientAiContext";
import type { TreatmentAppointment } from "@/services/patient_treatments";
import { formatAppointmentLabel } from "@/services/cdt";

type ToothTreatmentRow = {
  id: string;
  cdtCode: string | null;
  feeAmount: number;
  severity: string;
  title: string;
  status: string;
  appointment: TreatmentAppointment | null;
};

type Props = {
  patientKey: string;
  toothFdi: string;
  toothName: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;
  patientContext: PatientAiContextPayload;
  imaging: ChatAttachmentItem[];
  toothNotes: { id: string; body: string }[];
  toothTreatments: ToothTreatmentRow[];
  existing: {
    cdtCode: string | null;
    feeAmount: number;
    severity: string;
    title: string;
    status: string;
    toothFdi?: string | null;
  }[];
  onApplyDraft: (
    draft: TreatmentAiDraft,
    existingTreatmentId?: string | null,
  ) => void;
  onCreateDraft: (
    draft: TreatmentAiDraft,
    files: PendingFile[],
  ) => Promise<string | null>;
  onBook: (treatmentId: string) => void;
  onScheduleAt: (treatmentId: string, startsAtIso: string) => Promise<void>;
};

export function AiTreatmentChatPanel({
  patientKey,
  toothFdi,
  toothName,
  patientName,
  patientPhone,
  patientEmail,
  patientContext,
  imaging,
  toothNotes,
  toothTreatments,
  existing,
  onApplyDraft,
  onCreateDraft,
  onBook,
  onScheduleAt,
}: Props) {
  const t = useTranslations();
  const [tab, setTab] = useState<ChatPanelTab>("chat");
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState<TreatmentAiDraft | null>(null);
  const [poll, setPoll] = useState<TreatmentAiPoll | null>(null);
  const [pollSelectedId, setPollSelectedId] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingChatUpload[]>([]);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [proposalReview, setProposalReview] =
    useState<ProposalReviewState | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleTreatmentId, setRescheduleTreatmentId] = useState<
    string | null
  >(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const stored = loadChatHistory(patientKey, toothFdi);
    setMessages(stored?.messages ?? []);
    setDraft(stored?.draft ?? null);
    setPoll(stored?.poll ?? null);
    setPollSelectedId(stored?.pollSelectedId ?? null);
    setInput("");
    setPendingUploads((prev) => {
      revokePendingUploads(prev);
      return [];
    });
    setCreatedId(null);
    setTab("chat");
    setReady(true);
    return () => setReady(false);
  }, [patientKey, toothFdi]);

  useEffect(() => {
    if (!ready) return;
    saveChatHistory(patientKey, toothFdi, {
      messages,
      draft,
      poll,
      pollSelectedId,
    });
  }, [ready, patientKey, toothFdi, messages, draft, poll, pollSelectedId]);

  const existingForDraftId = useMemo(() => {
    if (createdId) return createdId;
    const code = draft?.cdt_code?.trim();
    if (!code) return null;
    return (
      toothTreatments.find(
        (row) => row.cdtCode === code && row.status !== "done",
      )?.id ?? null
    );
  }, [createdId, draft?.cdt_code, toothTreatments]);

  const bookedAppointment = useMemo(() => {
    if (!existingForDraftId) return null;
    const appt =
      toothTreatments.find((row) => row.id === existingForDraftId)
        ?.appointment ?? null;
    if (!appt || appt.status === "cancelled") return null;
    return appt;
  }, [existingForDraftId, toothTreatments]);

  async function uploadPending(): Promise<string[]> {
    const urls: string[] = [];
    for (const item of pendingUploads) {
      const uploaded = await uploadPatientImagingFile(patientKey, item.file);
      const toothNum = universalForFdi(toothFdi);
      await createPatientImaging(patientKey, {
        title: `Chat · ${toothName}`,
        kind: toImagingKind(item.kind),
        tooth_number: typeof toothNum === "number" ? toothNum : null,
        tooth_fdi: toothFdi,
        file_url: uploaded.file_url,
        file_name: uploaded.file_name,
        mime_type: uploaded.mime_type,
        taken_at: null,
      });
      urls.push(uploaded.file_url);
    }
    return urls;
  }

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if ((!text && pendingUploads.length === 0) || pending) return;
    setPending(true);
    try {
      const imageUrls = await uploadPending();
      const content =
        text ||
        (imageUrls.length > 0
          ? `Attached ${imageUrls.length} clinical image(s) for review.`
          : "");
      const userTurn: ChatTurn = {
        role: "user",
        content,
        at: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        imageUrls,
      };
      const nextMessages = [...messages, userTurn];
      setMessages(nextMessages);
      setInput("");
      setPendingUploads((prev) => {
        revokePendingUploads(prev);
        return [];
      });
      setPollSelectedId(null);

      const chartText = [
        formatPatientAiContext({
          ...patientContext,
          imageUrls,
        }),
        bookedAppointment
          ? `Focus tooth #${toothFdi} draft treatment appointment: ALREADY BOOKED at ${bookedAppointment.startsAt} (${bookedAppointment.status}) ${bookedAppointment.serviceLabel}. Do not ask to book again; offer reschedule only if needed.`
          : `Focus tooth #${toothFdi} draft treatment appointment: not booked yet.`,
      ].join("\n");
      const res = await fetch("/api/v1/ai/treatment-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toothFdi,
          toothName,
          patientName,
          patientChart: chartText,
          imageUrls,
          existing,
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const payload = (await res.json()) as {
        reply?: string;
        draft?: TreatmentAiDraft;
        poll?: TreatmentAiPoll | null;
        proposedActions?: ProposedAction[];
        error?: string;
      };
      if (!res.ok) throw new Error(payload.error ?? "AI failed");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: payload.reply ?? "Done.",
          at: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      if (payload.draft) setDraft(payload.draft);
      setPoll(payload.poll ?? null);
      if (payload.proposedActions?.length) {
        const review = await proposeFromChat({
          source: "treatment-chat",
          patientKey,
          summary: payload.reply ?? "Clinical changes",
          actions: payload.proposedActions.map((a) => ({
            ...a,
            payload: {
              patientKey,
              fdi: toothFdi,
              tooth_fdi: toothFdi,
              ...a.payload,
            },
          })),
        });
        setProposalReview(review);
      } else {
        setProposalReview(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.chat.aiFailed"));
    } finally {
      setPending(false);
    }
  }

  const attachmentItems = useMemo(() => {
    const byUrl = new Map<string, ChatAttachmentItem>();
    for (const item of imaging) {
      if (item.url) byUrl.set(item.url, item);
    }
    for (const msg of messages) {
      for (const [i, url] of (msg.imageUrls ?? []).entries()) {
        if (!url || byUrl.has(url)) continue;
        byUrl.set(url, {
          id: `chat-${msg.at ?? "t"}-${i}`,
          title: "Chat image",
          kind: "image",
          url,
        });
      }
    }
    return [...byUrl.values()];
  }, [imaging, messages]);

  function resolveScheduleTreatmentId(): string | null {
    return (
      existingForDraftId ??
      toothTreatments.find(
        (row) => row.appointment && row.status !== "done",
      )?.id ??
      toothTreatments.find((row) => row.status !== "done")?.id ??
      null
    );
  }

  function openReschedulePicker() {
    const treatmentId = resolveScheduleTreatmentId();
    if (!treatmentId) {
      toast.error(t("admin.chat.createOrSelect"));
      return;
    }
    if (!createdId) setCreatedId(treatmentId);
    setRescheduleTreatmentId(treatmentId);
    setRescheduleOpen(true);
    setTab("chat");
    void buildRescheduleSlotPoll(bookedAppointment?.startsAt, t).then((next) => {
      setPoll(next);
      setPollSelectedId(null);
    });
  }

  function onPollSelect(option: { id: string; label: string; value: string }) {
    setPollSelectedId(option.id);
    if (poll?.kind === "slot") {
      void handleSlotPick(option);
      return;
    }
    if (poll?.kind === "appointment" && option.value === "book_now") {
      if (bookedAppointment) {
        openReschedulePicker();
        return;
      }
      if (existingForDraftId) onBook(existingForDraftId);
      else if (createdId) onBook(createdId);
    }
    void send(t("admin.chat.selectedOptionValue").replace("{label}", option.label).replace("{value}", option.value));
  }

  async function handleSlotPick(option: {
    id: string;
    label: string;
    value: string;
  }) {
    const treatmentId = existingForDraftId ?? rescheduleTreatmentId;
    if (!treatmentId) {
      toast.error(t("admin.chat.createOrSelect"));
      return;
    }
    if (option.value === "custom") {
      openReschedulePicker();
      return;
    }
    setPending(true);
    try {
      await onScheduleAt(treatmentId, option.value);
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: t("admin.chat.selectedOption").replace("{label}", option.label),
          at: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
        {
          role: "assistant",
          content: `Booked for ${option.label}.`,
          at: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      setPoll(null);
      setPollSelectedId(null);
      toast.success(t("admin.chat.appointmentUpdated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.chat.couldNotSchedule"));
    } finally {
      setPending(false);
    }
  }

  async function confirmReschedule(startsAtIso: string) {
    const treatmentId = rescheduleTreatmentId ?? resolveScheduleTreatmentId();
    if (!treatmentId) {
      toast.error(t("admin.chat.createOrSelect"));
      return;
    }
    setPending(true);
    try {
      await onScheduleAt(treatmentId, startsAtIso);
      const label = formatAppointmentLabel(startsAtIso);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Appointment set for ${label}.`,
          at: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      setRescheduleOpen(false);
      setPoll(null);
      toast.success(t("admin.chat.appointmentUpdated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.chat.couldNotSchedule"));
    } finally {
      setPending(false);
    }
  }

  function onSlashCommand(command: ChatSlashCommand) {
    if (command.id === "reschedule") {
      openReschedulePicker();
      return;
    }
    if (command.id === "book") {
      if (bookedAppointment) {
        openReschedulePicker();
        return;
      }
      if (existingForDraftId) onBook(existingForDraftId);
      else toast.error(t("admin.chat.createThenBook"));
    }
  }

  async function handleCreate() {
    if (!draft?.cdt_code) return;
    const files: PendingFile[] = pendingUploads.map((item) => ({
      file: item.file,
      asXray: item.kind === "xray" || item.kind === "cbct",
    }));
    const id = await onCreateDraft(draft, files);
    if (id) {
      setCreatedId(id);
      const row = toothTreatments.find((t) => t.id === id);
      if (draft.appointment?.book && !row?.appointment) onBook(id);
    }
  }

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const allowed = [...list].filter(
      (f) =>
        f.type.startsWith("image/") ||
        f.type === "application/pdf" ||
        f.name.toLowerCase().endsWith(".dcm"),
    );
    if (allowed.length === 0) {
      toast.error(t("admin.chat.attachTypes"));
      return;
    }
    setPendingUploads((prev) =>
      [...prev, ...createPendingUploads(allowed)].slice(0, 8),
    );
  }

  function removeUpload(id: string) {
    setPendingUploads((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  return (
    <ChatShell className="lg:border-s lg:border-[#E8EAED]">
      <ChatPanelHeader
        title={patientName}
        subtitle={`Tooth #${toothFdi} · ${toothName}`}
        tab={tab}
        onTabChange={setTab}
        onViewProfile={() => setProfileOpen(true)}
        canClear={messages.length > 0}
        onClear={() => {
          clearChatHistory(patientKey, toothFdi);
          setMessages([]);
          setDraft(null);
          setPoll(null);
          setPollSelectedId(null);
          setCreatedId(null);
          setRescheduleOpen(false);
          toast.success(t("admin.chat.cleared"));
        }}
      />
      <ClientProfileDrawer
        open={profileOpen}
        patientKey={patientKey}
        displayName={patientName}
        phone={patientPhone}
        email={patientEmail}
        onClose={() => setProfileOpen(false)}
      />

      {tab === "attachments" ? (
        <ChatAttachmentsTab
          items={attachmentItems}
          pendingUploads={pendingUploads}
          uploading={pending}
        />
      ) : null}

      {tab === "details" ? (
        <ChatDetailsTab
          toothLabel={`#${toothFdi}`}
          draft={draft}
          treatments={toothTreatments}
          notes={toothNotes}
        />
      ) : null}

      {tab === "chat" ? (
        <>
          <ChatThread
            messages={messages}
            draft={draft}
            activePoll={poll}
            pollSelectedId={pollSelectedId}
            pending={pending}
            createdTreatmentId={existingForDraftId}
            bookedAppointment={bookedAppointment}
            onPollSelect={onPollSelect}
            onCreate={() => void handleCreate()}
            onReview={() => {
              if (draft) onApplyDraft(draft, existingForDraftId);
            }}
            onBook={() => {
              if (bookedAppointment) openReschedulePicker();
              else if (existingForDraftId) onBook(existingForDraftId);
            }}
          />
          {proposalReview ? (
            <div className="border-t border-[#E8EAED] px-4 pb-2">
              <ActionReviewCard
                review={proposalReview}
                disabled={pending}
                onResolved={() => setProposalReview(null)}
              />
            </div>
          ) : null}
          <RescheduleDatePopover
            open={rescheduleOpen}
            pending={pending}
            currentStartsAt={
              (rescheduleTreatmentId
                ? toothTreatments.find((r) => r.id === rescheduleTreatmentId)
                    ?.appointment?.startsAt
                : null) ?? bookedAppointment?.startsAt
            }
            busyStartsAt={patientContext.visits.map((v) => v.startsAt)}
            onClose={() => setRescheduleOpen(false)}
            onConfirm={(iso) => void confirmReschedule(iso)}
          />
          <ChatComposer
            value={input}
            pending={pending}
            pendingUploads={pendingUploads}
            disabled={pending || (!input.trim() && pendingUploads.length === 0)}
            onChange={setInput}
            onSend={() => void send()}
            onAddFiles={addFiles}
            onRemoveUpload={removeUpload}
            onSlashCommand={onSlashCommand}
          />
        </>
      ) : null}
    </ChatShell>
  );
}

function toImagingKind(
  kind: ChatResourceKind,
): "photo" | "xray" | "cbct" {
  if (kind === "xray" || kind === "cbct") return kind;
  return "photo";
}
