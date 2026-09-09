"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClinicDashboard } from "@/features/admin/components/overview/ClinicDashboard";
import { chatTransition, panelVariants } from "@/features/admin/components/chat/chatMotion";
import { buildShowreelDashboardProps } from "./buildShowreelDashboardProps";
import { buildShowreelDemoClinical } from "./buildShowreelDemoClinical";
import { buildShowreelDemoInbox } from "./buildShowreelDemoInbox";
import { DEMO_CONV } from "./fixtures/demoIds";
import { ShowreelAdminSceneFrame } from "./ShowreelAdminSceneFrame";
import { ShowreelReservationsDemo } from "./ShowreelReservationsDemo";
import {
  SHOWREEL_NAVIGATE_EVENT,
  type ShowreelNavigateDetail,
} from "./showreelAdminEvents";
import { SHOWREEL_SMART_UX_CURSOR_STEPS } from "./showreelCursorTimeline";

type Props = { active: boolean };

type DemoPage = "overview" | "reservations";

/** Real admin shell: ⌘K → page → WhatsApp send → dock → collapse. */
export function SmartUxScene({ active }: Props) {
  const props = useMemo(() => buildShowreelDashboardProps(), []);
  const demoInbox = useMemo(
    () => buildShowreelDemoInbox(DEMO_CONV.sara),
    [],
  );
  const demoClinical = useMemo(() => buildShowreelDemoClinical(), []);
  const [page, setPage] = useState<DemoPage>("overview");

  useEffect(() => {
    if (!active) {
      setPage("overview");
      return;
    }
    function onNavigate(event: Event) {
      const detail = (event as CustomEvent<ShowreelNavigateDetail>).detail;
      if (!detail?.href) return;
      if (detail.href.startsWith("/admin/reservations")) {
        setPage("reservations");
      }
    }
    window.addEventListener(SHOWREEL_NAVIGATE_EVENT, onNavigate);
    return () => window.removeEventListener(SHOWREEL_NAVIGATE_EVENT, onNavigate);
  }, [active]);

  return (
    <ShowreelAdminSceneFrame
      active={active}
      cursorSteps={SHOWREEL_SMART_UX_CURSOR_STEPS}
      forceChatLayout="float"
      demoInbox={demoInbox}
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
          {page === "reservations" ? (
            <ShowreelReservationsDemo />
          ) : (
            <ClinicDashboard
              {...props}
              demoMode
              demoClinical={demoClinical}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </ShowreelAdminSceneFrame>
  );
}
