"use client";

import type { ReactNode } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Admin tokens + nuqs for real ClinicDashboard / SupportInbox embeds. */
export function ShowreelAdminChrome({ children, className }: Props) {
  return (
    <NuqsAdapter>
      <div
        className={cn(
          "admin-shell showreel-demo-admin min-h-screen bg-[var(--admin-canvas,#f7f8f8)] text-[var(--admin-text,#1a1a1a)]",
          className,
        )}
      >
        {children}
      </div>
    </NuqsAdapter>
  );
}
