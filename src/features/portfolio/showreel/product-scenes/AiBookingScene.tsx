"use client";

import { useMemo } from "react";
import { ClinicDashboard } from "@/features/admin/components/overview/ClinicDashboard";
import { buildShowreelDashboardProps } from "./buildShowreelDashboardProps";
import { ShowreelAdminSceneFrame } from "./ShowreelAdminSceneFrame";
import { ShowreelAssistBookingPanel } from "./ShowreelAssistBookingPanel";
import { SHOWREEL_AI_BOOKING_CURSOR_STEPS } from "./showreelCursorTimeline";

type Props = { active: boolean };

/** Clinic Assist in the same float panel as the live dashboard. */
export function AiBookingScene({ active }: Props) {
  const props = useMemo(() => buildShowreelDashboardProps(), []);

  return (
    <ShowreelAdminSceneFrame
      active={active}
      cursorSteps={SHOWREEL_AI_BOOKING_CURSOR_STEPS}
      forceChatLayout="float"
      forceChatOpen
      className="showreel-demo-booking"
      demoAssistPanel={<ShowreelAssistBookingPanel active={active} />}
    >
      <ClinicDashboard {...props} demoMode />
    </ShowreelAdminSceneFrame>
  );
}
