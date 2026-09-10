"use client";

import { useMemo } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { ClinicDashboard } from "@/features/admin/components/overview/ClinicDashboard";
import { buildShowreelDashboardProps } from "./buildShowreelDashboardProps";
import { buildShowreelDemoClinical } from "./buildShowreelDemoClinical";
import { buildShowreelDemoInbox } from "./buildShowreelDemoInbox";
import { ShowreelCursorOverlay } from "./ShowreelCursorOverlay";
import {
  useShowreelBlockAdminNav,
  useShowreelDashboardCursor,
} from "./useShowreelDashboardCursor";

type Props = { active: boolean };

function pendingFromAttention(
  attention: ReturnType<typeof buildShowreelDashboardProps>["attention"],
): number {
  const row = attention.find((a) => a.id === "pending");
  if (!row) return 0;
  const n = Number(row.detail);
  return Number.isFinite(n) ? n : 0;
}

export function DashboardScene({ active }: Props) {
  const props = useMemo(() => buildShowreelDashboardProps(), []);
  const demoInbox = useMemo(() => buildShowreelDemoInbox(), []);
  const demoClinical = useMemo(() => buildShowreelDemoClinical(), []);
  const cursor = useShowreelDashboardCursor(active, active ? 1 : 0);
  useShowreelBlockAdminNav(true);

  return (
    <NuqsAdapter>
      <div className="showreel-demo-dashboard relative h-screen overflow-hidden">
        <AdminShell
          key={active ? "live" : "idle"}
          pendingCount={pendingFromAttention(props.attention)}
          demoInbox={demoInbox}
          forceChatLayout="float"
          forceSidebarCollapsed={false}
        >
          <ClinicDashboard
            {...props}
            demoMode
            demoClinical={demoClinical}
          />
        </AdminShell>
        <ShowreelCursorOverlay {...cursor} />
      </div>
    </NuqsAdapter>
  );
}
