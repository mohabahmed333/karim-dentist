"use client";

import type { ReactNode } from "react";
import { useTranslations } from "@/lib/i18n";
import type { TreatmentAiDraft, TreatmentAiPoll } from "@/services/ai_groq";
import type { TreatmentAppointment } from "@/services/patient_treatments";
import { AiDraftPreview } from "./AiDraftPreview";
import { ChatBookedBanner } from "./ChatBookedBanner";
import { ChatMessageAttachmentStack } from "./ChatMessageAttachment";
import { ChatPollCard } from "./ChatPollCard";
import { CHAT_BODY, CHAT_BUBBLE, CHAT_META } from "./chatSkin";
import { chatTextDir } from "./chatTextDirection";

export type ThreadMessage = {
  role: "user" | "assistant";
  content: string;
  at?: string;
  imageUrls?: string[];
  poll?: TreatmentAiPoll | null;
  pollSelectedId?: string | null;
};

type Props = {
  messages: ThreadMessage[];
  draft: TreatmentAiDraft | null;
  activePoll: TreatmentAiPoll | null;
  pollSelectedId: string | null;
  pending: boolean;
  createdTreatmentId: string | null;
  bookedAppointment: TreatmentAppointment | null;
  onPollSelect: (option: { id: string; label: string; value: string }) => void;
  onCreate: () => void;
  onReview: () => void;
  onBook: () => void;
};

export function ChatThread({
  messages,
  draft,
  activePoll,
  pollSelectedId,
  pending,
  createdTreatmentId,
  bookedAppointment,
  onPollSelect,
  onCreate,
  onReview,
  onBook,
}: Props) {
  const t = useTranslations();
  const lastAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === "assistant") return i;
    }
    return -1;
  })();

  return (
    <div className={`min-h-0 flex-1 overflow-y-auto ${CHAT_BODY}`}>
      <div className="space-y-5 p-4">
        {messages.length === 0 ? (
          <p className="pt-16 text-center text-[12px] text-[#9CA3AF]">
            {t("admin.chat.askTooth")}
          </p>
        ) : null}
        {messages.map((row, index) => {
          const isUser = row.role === "user";
          const showExtras = !isUser && index === lastAssistantIndex;
          return (
            <MessageGroup
              key={`${row.role}-${index}`}
              isUser={isUser}
              name={isUser ? t("admin.chat.you") : t("admin.chat.aiAssist")}
              at={row.at}
              content={row.content}
              images={row.imageUrls}
              extras={
                showExtras ? (
                  <MessageExtras
                    draft={draft}
                    activePoll={activePoll}
                    pollSelectedId={pollSelectedId}
                    pending={pending}
                    createdTreatmentId={createdTreatmentId}
                    bookedAppointment={bookedAppointment}
                    onPollSelect={onPollSelect}
                    onCreate={onCreate}
                    onReview={onReview}
                    onBook={onBook}
                  />
                ) : null
              }
            />
          );
        })}
      </div>
    </div>
  );
}

function MessageGroup({
  isUser,
  name,
  at,
  content,
  images,
  extras,
}: {
  isUser: boolean;
  name: string;
  at?: string;
  content: string;
  images?: string[];
  extras: ReactNode;
}) {
  const dir = chatTextDir(content);
  const align = dir === "rtl" ? "text-end" : "text-start";

  return (
    <div className={isUser ? "ms-8" : "me-4"}>
      <div
        className={`mb-1 flex items-baseline gap-2 ${
          dir === "rtl" ? "flex-row-reverse" : ""
        }`}
      >
        <span className={`text-[11px] font-semibold ${CHAT_META}`}>{name}</span>
        {at ? <span className={`text-[10px] ${CHAT_META}`}>{at}</span> : null}
      </div>
      <div className={`${CHAT_BUBBLE} px-3.5 py-2.5`}>
        <p
          dir={dir}
          className={`text-[13px] leading-relaxed whitespace-pre-wrap text-[#111111] ${align}`}
        >
          {content}
        </p>
        {images?.length ? (
          <ChatMessageAttachmentStack urls={images} />
        ) : null}
        {extras}
      </div>
    </div>
  );
}

function MessageExtras({
  draft,
  activePoll,
  pollSelectedId,
  pending,
  createdTreatmentId,
  bookedAppointment,
  onPollSelect,
  onCreate,
  onReview,
  onBook,
}: {
  draft: TreatmentAiDraft | null;
  activePoll: TreatmentAiPoll | null;
  pollSelectedId: string | null;
  pending: boolean;
  createdTreatmentId: string | null;
  bookedAppointment: TreatmentAppointment | null;
  onPollSelect: (option: { id: string; label: string; value: string }) => void;
  onCreate: () => void;
  onReview: () => void;
  onBook: () => void;
}) {
  const t = useTranslations();
  const alreadyBooked = Boolean(bookedAppointment);
  const showApptPoll =
    activePoll &&
    !(activePoll.kind === "appointment" && alreadyBooked);

  return (
    <>
      {bookedAppointment ? (
        <ChatBookedBanner appointment={bookedAppointment} />
      ) : null}
      {showApptPoll ? (
        <ChatPollCard
          question={activePoll.question}
          options={activePoll.options}
          selectedId={pollSelectedId}
          disabled={pending}
          onSelect={onPollSelect}
        />
      ) : null}
      {activePoll?.kind === "appointment" && alreadyBooked ? (
        <p className="mt-2 text-[11px] text-[#70758A]">
          {t("admin.chat.alreadyBookedHint")}
        </p>
      ) : null}
      {draft?.cdt_code ? (
        <div className="mt-2 border-t border-[#E8EAED] pt-2">
          <AiDraftPreview draft={draft} />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || Boolean(createdTreatmentId)}
              onClick={onCreate}
              className="rounded-lg bg-[#111111] px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40"
            >
              {createdTreatmentId
                ? t("admin.chat.alreadyCreated")
                : t("admin.chat.createTreatment")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onReview}
              className="rounded-lg border border-[#E8EAED] bg-transparent px-3 py-1.5 text-[11px] font-semibold text-[#111111]"
            >
              {createdTreatmentId ? t("admin.chat.reviewExisting") : t("admin.chat.reviewWizard")}
            </button>
            {createdTreatmentId || draft.appointment?.book || alreadyBooked ? (
              <button
                type="button"
                disabled={pending || !createdTreatmentId}
                onClick={onBook}
                className="rounded-lg border border-[#E8EAED] bg-transparent px-3 py-1.5 text-[11px] font-semibold text-[#111111] disabled:opacity-40"
              >
                {alreadyBooked ? t("admin.chat.action.reschedule") : t("admin.chat.bookAppointment")}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
