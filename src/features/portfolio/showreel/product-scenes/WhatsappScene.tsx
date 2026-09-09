"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClinicDashboard } from "@/features/admin/components/overview/ClinicDashboard";
import { chatTransition, panelVariants } from "@/features/admin/components/chat/chatMotion";
import {
  SUPPORT_CONVERSATIONS,
  SUPPORT_DETAILS,
  SUPPORT_MESSAGES,
} from "@/features/admin/components/support/supportDummyData";
import type { AdminDemoInbox } from "@/features/admin/lib/adminDemoInbox";
import { buildShowreelDashboardProps } from "./buildShowreelDashboardProps";
import { WHATSAPP_SHOWREEL_SCRIPT } from "./fixtures/whatsappFixtures";
import { ShowreelAdminSceneFrame } from "./ShowreelAdminSceneFrame";
import { ShowreelClinicWorkspaceDemo } from "./ShowreelClinicWorkspaceDemo";
import {
  SHOWREEL_NAVIGATE_EVENT,
  type ShowreelNavigateDetail,
} from "./showreelAdminEvents";
import { SHOWREEL_WHATSAPP_CURSOR_STEPS } from "./showreelCursorTimeline";
import { useShowreelPhase } from "./useShowreelPhase";

type Phase = "unread" | "open";
type DemoPage = "overview" | "workspace";

const STEPS: { id: Phase; at: number }[] = [{ id: "open", at: 600 }];

type Props = { active: boolean };

function buildInbox(phase: Phase): AdminDemoInbox {
  const scriptId = WHATSAPP_SHOWREEL_SCRIPT.conversationId;
  const conversations =
    phase === "unread"
      ? SUPPORT_CONVERSATIONS
      : SUPPORT_CONVERSATIONS.map((c) =>
          c.id === scriptId ? { ...c, unread: undefined } : c,
        );

  return {
    conversations,
    detailsById: SUPPORT_DETAILS,
    messagesById: Object.fromEntries(
      Object.entries(SUPPORT_MESSAGES).map(([id, msgs]) => [id, [...msgs]]),
    ),
    openCount: conversations.length,
    forcedSelectedId: scriptId,
  };
}

/** WhatsApp → workspace → offer slots → confirm reservation. */
export function WhatsappScene({ active }: Props) {
  const dash = useMemo(() => buildShowreelDashboardProps(), []);
  const phase = useShowreelPhase(active, "unread", STEPS);
  const demoInbox = useMemo(() => buildInbox(phase), [phase]);
  const [page, setPage] = useState<DemoPage>("overview");

  useEffect(() => {
    if (!active) {
      setPage("overview");
      return;
    }
    function onNavigate(event: Event) {
      const detail = (event as CustomEvent<ShowreelNavigateDetail>).detail;
      if (detail?.kind === "workspace") setPage("workspace");
    }
    window.addEventListener(SHOWREEL_NAVIGATE_EVENT, onNavigate);
    return () => window.removeEventListener(SHOWREEL_NAVIGATE_EVENT, onNavigate);
  }, [active]);

  return (
    <ShowreelAdminSceneFrame
      active={active}
      cursorSteps={SHOWREEL_WHATSAPP_CURSOR_STEPS}
      forceChatLayout="float"
      forceWhatsappOpen
      demoInbox={demoInbox}
      className="showreel-demo-whatsapp"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={page}
          className="h-full min-h-0"
          variants={panelVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          transition={chatTransition(false, 0.22)}
        >
          {page === "workspace" ? (
            <ShowreelClinicWorkspaceDemo />
          ) : (
            <ClinicDashboard {...dash} demoMode />
          )}
        </motion.div>
      </AnimatePresence>
    </ShowreelAdminSceneFrame>
  );
}
