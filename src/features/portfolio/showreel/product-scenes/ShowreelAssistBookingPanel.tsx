"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ActionReviewCard,
  type ProposalReviewState,
} from "@/features/admin/components/chat/ActionReviewCard";
import { ChatPanelHeader } from "@/features/admin/components/chat/ChatPanelHeader";
import { ChatShell } from "@/features/admin/components/chat/ChatShell";
import { CHAT_BUBBLE, CHAT_META } from "@/features/admin/components/chat/chatSkin";
import {
  chatTransition,
  messageVariants,
  workingVariants,
} from "@/features/admin/components/chat/chatMotion";
import type { AdminChatLayout } from "@/features/admin/hooks/useAdminChatLayout";
import { useTranslations } from "@/lib/i18n";
import {
  BOOKING_SLOT_FIXTURES,
  RESERVATION_FIXTURES,
} from "./fixtures/reservationFixtures";
import {
  SHOWREEL_ASSIST_EVENT,
  type ShowreelAssistDetail,
} from "./showreelAssistEvents";
import { useShowreelPhase } from "./useShowreelPhase";

type Props = {
  active: boolean;
  chatLayout?: AdminChatLayout;
  onToggleChatLayout?: () => void;
  onCollapseDock?: () => void;
  onClose?: () => void;
};

type Step =
  | "request"
  | "working-extract"
  | "extract"
  | "working-slot"
  | "slot"
  | "working-review"
  | "review"
  | "created";

// Real AI turns never resolve instantly — a short "Working…" beat before
// each result, same as the production Clinic Assist chat.
const STEPS: { id: Step; at: number }[] = [
  { id: "working-extract", at: 2200 },
  { id: "extract", at: 2800 },
  { id: "working-slot", at: 4900 },
  { id: "slot", at: 5500 },
  { id: "working-review", at: 7900 },
  { id: "review", at: 8500 },
  { id: "created", at: 13000 },
];

const STEP_ORDER: Step[] = STEPS.map((s) => s.id);
STEP_ORDER.unshift("request");

function atLeast(step: Step, target: Step): boolean {
  return STEP_ORDER.indexOf(step) >= STEP_ORDER.indexOf(target);
}

function bookingReview(
  patientName: string,
  service: string,
  slot: string,
): ProposalReviewState {
  return {
    proposalId: "showreel-booking",
    summary: `Create reservation for ${patientName}`,
    diffs: [
      {
        actionId: "book-1",
        kind: "followup.book",
        target: `${service} · ${slot}`,
        before: {},
        after: { patientName, service, slot, status: "pending" },
        warnings: [],
      },
    ],
    actions: [],
  };
}

/** A message bubble that fades/slides in exactly like the real chat's own messages. */
function MotionBubble({
  isUser,
  className = "",
  children,
}: {
  isUser?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={`${CHAT_BUBBLE} ${isUser ? "ms-8" : ""} ${className}`}
      custom={isUser}
      variants={messageVariants}
      initial="hidden"
      animate="show"
      transition={chatTransition(false)}
    >
      {children}
    </motion.div>
  );
}

function WorkingIndicator({ label }: { label: string }) {
  return (
    <motion.p
      className={`text-[12px] ${CHAT_META}`}
      variants={workingVariants}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {label}
    </motion.p>
  );
}

/** Scripted Clinic Assist body for the float/dock panel (same chrome as dashboard). */
export function ShowreelAssistBookingPanel({
  active,
  chatLayout,
  onToggleChatLayout,
  onCollapseDock,
  onClose,
}: Props) {
  const t = useTranslations();
  const step = useShowreelPhase(active, "request", STEPS);
  const patient = RESERVATION_FIXTURES[0]!;
  const slot = BOOKING_SLOT_FIXTURES[0]!;
  const [confirmed, setConfirmed] = useState(false);
  const [followupText, setFollowupText] = useState("");
  const [followupSent, setFollowupSent] = useState(false);
  const [showAck, setShowAck] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const review = useMemo(
    () =>
      bookingReview(patient.patientName, patient.serviceLabel, slot.label),
    [patient.patientName, patient.serviceLabel, slot.label],
  );

  const showExtract = atLeast(step, "extract") || confirmed;
  const showSlot = atLeast(step, "slot") || confirmed;
  const showReview = atLeast(step, "review") || confirmed;
  const showCreated = confirmed || step === "created";

  useEffect(() => {
    if (!active) return;
    const ackTimers: number[] = [];

    function onEvent(event: Event) {
      const detail = (event as CustomEvent<ShowreelAssistDetail>).detail;
      if (!detail) return;
      if (detail.type === "compose-followup") setFollowupText(detail.text);
      if (detail.type === "send-followup") {
        setFollowupSent(true);
        ackTimers.push(window.setTimeout(() => setShowAck(true), 900));
      }
    }
    window.addEventListener(SHOWREEL_ASSIST_EVENT, onEvent);
    return () => {
      window.removeEventListener(SHOWREEL_ASSIST_EVENT, onEvent);
      ackTimers.forEach((id) => window.clearTimeout(id));
      // No setState here in the body: going active -> inactive already runs
      // this cleanup (same as useShowreelCursorScript), so resetting for the
      // next replay belongs here, not in a separate "if (!active)" effect.
      setConfirmed(false);
      setFollowupText("");
      setFollowupSent(false);
      setShowAck(false);
    };
  }, [active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [step, confirmed, followupSent, showAck]);

  return (
    <ChatShell className="h-full min-h-0">
      <ChatPanelHeader
        title="Clinic Assist"
        subtitle="AI booking · review first"
        onClose={onClose}
        chatLayout={chatLayout}
        onToggleChatLayout={onToggleChatLayout}
        onCollapseDock={onCollapseDock}
      />
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        <AnimatePresence initial={false}>
          <MotionBubble
            key="request"
            isUser
            className="bg-[var(--admin-primary)] text-white"
          >
            Book Sara for teeth whitening this week
          </MotionBubble>

          {step === "working-extract" ? (
            <WorkingIndicator key="working-extract" label={t("admin.chat.working")} />
          ) : null}
          {showExtract ? (
            <MotionBubble key="extract">
              Extracted · {patient.patientName} · {patient.serviceLabel} ·{" "}
              {patient.phone}
            </MotionBubble>
          ) : null}

          {step === "working-slot" ? (
            <WorkingIndicator key="working-slot" label={t("admin.chat.working")} />
          ) : null}
          {showSlot ? (
            <MotionBubble key="slot">
              Suggested slot · {slot.label}
            </MotionBubble>
          ) : null}

          {step === "working-review" ? (
            <WorkingIndicator key="working-review" label={t("admin.chat.working")} />
          ) : null}
          {showReview ? (
            <motion.div
              key="review"
              data-showreel-action="assist-review"
              variants={messageVariants}
              initial="hidden"
              animate="show"
              transition={chatTransition(false)}
            >
              <ActionReviewCard
                review={review}
                localOnly
                onResolved={(ok) => setConfirmed(ok)}
              />
            </motion.div>
          ) : null}

          {showCreated ? (
            <MotionBubble key="created">
              Reservation created — pending confirmation.
            </MotionBubble>
          ) : null}

          {followupSent ? (
            <MotionBubble
              key="followup"
              isUser
              className="bg-[var(--admin-primary)] text-white"
            >
              {followupText}
            </MotionBubble>
          ) : null}
          {showAck ? (
            <MotionBubble key="ack">
              Sent — Sara will get a WhatsApp confirmation too.
            </MotionBubble>
          ) : null}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-[var(--admin-border)] bg-white px-3 py-2">
        <input
          data-showreel-action="assist-composer"
          readOnly
          value={followupSent ? "" : followupText}
          placeholder="Ask Clinic Assist…"
          className="h-9 w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)] px-3 text-[13px] outline-none"
        />
        <p className={`mt-1 text-[11px] ${CHAT_META}`}>
          Human review required before any write
        </p>
      </div>
    </ChatShell>
  );
}
