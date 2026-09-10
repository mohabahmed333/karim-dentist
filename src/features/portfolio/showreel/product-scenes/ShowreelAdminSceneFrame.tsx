"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AdminShell } from "@/features/admin/components/AdminShell";
import type { AdminChatLayout } from "@/features/admin/hooks/useAdminChatLayout";
import { buildShowreelDashboardProps } from "./buildShowreelDashboardProps";
import { buildShowreelDemoInbox } from "./buildShowreelDemoInbox";
import { ShowreelCursorOverlay } from "./ShowreelCursorOverlay";
import {
  useShowreelBlockAdminNav,
  useShowreelCursorScript,
} from "./useShowreelDashboardCursor";
import type { ShowreelCursorStep } from "./showreelCursorTimeline";

type Props = {
  active: boolean;
  children: ReactNode;
  cursorSteps: ShowreelCursorStep[];
  forceChatLayout?: AdminChatLayout;
  forceWhatsappOpen?: boolean;
  forceChatOpen?: boolean;
  forceDockCollapsed?: boolean;
  demoAssistPanel?: ReactNode | null;
  demoInbox?: ReturnType<typeof buildShowreelDemoInbox> | null;
  hideFloatingBubbles?: boolean;
  forceFlushMain?: boolean;
  className?: string;
};

/** Shared offline AdminShell frame for real product showreel scenes. */
export function ShowreelAdminSceneFrame({
  active,
  children,
  cursorSteps,
  forceChatLayout = "float",
  forceWhatsappOpen,
  forceChatOpen,
  forceDockCollapsed,
  demoAssistPanel = null,
  demoInbox: demoInboxProp,
  hideFloatingBubbles = false,
  forceFlushMain = false,
  className = "showreel-demo-dashboard",
}: Props) {
  const dash = useMemo(() => buildShowreelDashboardProps(), []);
  const fallbackInbox = useMemo(() => buildShowreelDemoInbox(), []);
  const demoInbox = demoInboxProp ?? fallbackInbox;
  const cursor = useShowreelCursorScript(active, active ? 1 : 0, cursorSteps);
  useShowreelBlockAdminNav(true);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.showreelDemo = "1";
    return () => {
      delete root.dataset.showreelDemo;
    };
  }, []);

  const pending = Number(
    dash.attention.find((a) => a.id === "pending")?.detail ?? 0,
  );

  return (
    <NuqsAdapter>
      <div
        className={`relative h-screen overflow-hidden ${className}`}
        data-showreel-demo="1"
      >
        <AdminShell
          key={active ? "live" : "idle"}
          pendingCount={Number.isFinite(pending) ? pending : 0}
          demoInbox={demoInbox}
          demoAssistPanel={demoAssistPanel}
          forceChatLayout={forceChatLayout}
          forceWhatsappOpen={forceWhatsappOpen}
          forceChatOpen={forceChatOpen}
          forceDockCollapsed={forceDockCollapsed}
          hideFloatingBubbles={hideFloatingBubbles}
          forceFlushMain={forceFlushMain}
          forceSidebarCollapsed={false}
        >
          {children}
        </AdminShell>
        <ShowreelCursorOverlay {...cursor} />
      </div>
    </NuqsAdapter>
  );
}
