"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PortfolioData } from "@/services/portfolio";
import { ClinicDashboard } from "@/features/admin/components/overview/ClinicDashboard";
import { chatTransition, panelVariants } from "@/features/admin/components/chat/chatMotion";
import { buildShowreelDashboardProps } from "./buildShowreelDashboardProps";
import { buildShowreelDemoClinical } from "./buildShowreelDemoClinical";
import { buildShowreelSiteToChatInbox } from "./buildShowreelSiteToChatInbox";
import { ShowreelAdminSceneFrame } from "./ShowreelAdminSceneFrame";
import { ShowreelCursorOverlay } from "./ShowreelCursorOverlay";
import { ShowreelPublicBookingPanel } from "./ShowreelPublicBookingPanel";
import { ShowreelSupportPageDemo } from "./ShowreelSupportPageDemo";
import {
  SHOWREEL_NAVIGATE_EVENT,
  type ShowreelNavigateDetail,
} from "./showreelAdminEvents";
import { SHOWREEL_SITE_TO_CHAT_CURSOR_STEPS } from "./showreelSiteToChatTimeline";
import { useShowreelCursorScript } from "./useShowreelDashboardCursor";
import { useShowreelPhase } from "./useShowreelPhase";

type Props = {
  active: boolean;
  siteData: PortfolioData;
};

type DemoPage = "overview" | "support";

const PHASE_STEPS = [{ id: "admin" as const, at: 10000 }];

/** Public booking → dashboard → sidebar Front desk page → reply. */
export function SiteToChatScene({ active, siteData }: Props) {
  const phase = useShowreelPhase(active, "public", PHASE_STEPS);
  const dash = useMemo(() => buildShowreelDashboardProps(), []);
  const demoInbox = useMemo(() => buildShowreelSiteToChatInbox(), []);
  const demoClinical = useMemo(() => buildShowreelDemoClinical(), []);
  const [page, setPage] = useState<DemoPage>("overview");
  const onSupport = page === "support";
  const cursor = useShowreelCursorScript(
    active,
    active ? 1 : 0,
    SHOWREEL_SITE_TO_CHAT_CURSOR_STEPS,
    ".showreel-demo-site-to-chat",
  );

  useEffect(() => {
    if (!active || phase !== "admin") {
      setPage("overview");
      return;
    }
    function onNavigate(event: Event) {
      const detail = (event as CustomEvent<ShowreelNavigateDetail>).detail;
      if (detail?.href?.startsWith("/admin/support")) setPage("support");
    }
    window.addEventListener(SHOWREEL_NAVIGATE_EVENT, onNavigate);
    return () => window.removeEventListener(SHOWREEL_NAVIGATE_EVENT, onNavigate);
  }, [active, phase]);

  return (
    <div
      className="showreel-demo-site-to-chat relative h-screen overflow-hidden"
      data-showreel-demo="1"
    >
      {/* Public site -> the whole admin dashboard was an instant swap
          before — arguably the biggest single moment in the reel, now the
          one scene-internal transition big enough to earn the same
          crossfade the slide deck itself uses between scenes. */}
      <AnimatePresence mode="wait" initial={false}>
        {phase === "public" ? (
          <motion.div
            key="public"
            className="h-full"
            variants={panelVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={chatTransition(false, 0.3)}
          >
            <ShowreelPublicBookingPanel active={active} siteData={siteData} />
          </motion.div>
        ) : (
          <motion.div
            key="admin"
            className="h-full"
            variants={panelVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={chatTransition(false, 0.3)}
          >
            <ShowreelAdminSceneFrame
              active={active}
              cursorSteps={[]}
              forceChatLayout="float"
              demoInbox={demoInbox}
              hideFloatingBubbles
              forceFlushMain={onSupport}
              className="h-full"
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
                  {onSupport ? (
                    <ShowreelSupportPageDemo inbox={demoInbox} />
                  ) : (
                    <ClinicDashboard
                      {...dash}
                      demoMode
                      demoClinical={demoClinical}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </ShowreelAdminSceneFrame>
          </motion.div>
        )}
      </AnimatePresence>
      <ShowreelCursorOverlay {...cursor} />
    </div>
  );
}
