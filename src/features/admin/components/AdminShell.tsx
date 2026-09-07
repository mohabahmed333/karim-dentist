"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AdminIconRail } from "./AdminIconRail";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { AdminFloatingBubbles } from "./AdminFloatingBubbles";
import { QuickBookProvider } from "./quick-book/QuickBookProvider";
import { useAdminSidebarCollapse } from "@/features/admin/hooks/useAdminSidebarCollapse";
import {
  DEFAULT_DASHBOARD_PRIMARY,
  DEFAULT_DASHBOARD_SECONDARY,
} from "@/services/site_settings/dashboardTheme";
import { ADMIN_THEME_EVENT } from "@/features/admin/lib/adminThemeEvent";

const SIDEBAR_WIDTH = 220;

type Props = {
  children: ReactNode;
  pendingCount?: number;
  primaryColor?: string;
  secondaryColor?: string;
};

export function AdminShell({
  children,
  pendingCount = 0,
  primaryColor = DEFAULT_DASHBOARD_PRIMARY,
  secondaryColor = DEFAULT_DASHBOARD_SECONDARY,
}: Props) {
  const pathname = usePathname();
  const isCustomize = pathname.startsWith("/admin/customize");
  const isSupport = pathname.startsWith("/admin/support");
  const flushMain = isCustomize || isSupport;
  const { locale } = useLocale();
  const reduced = useReducedMotion();
  const { collapsed, toggle } = useAdminSidebarCollapse();
  const sidebarCollapsed = isCustomize || collapsed;
  const [primary, setPrimary] = useState(primaryColor);
  const [secondary, setSecondary] = useState(secondaryColor);
  const [chatOpen, setChatOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  useEffect(() => {
    if (isSupport) {
      setChatOpen(false);
      setWhatsappOpen(false);
    }
  }, [isSupport]);

  useEffect(() => {
    setPrimary(primaryColor);
    setSecondary(secondaryColor);
  }, [primaryColor, secondaryColor]);

  useEffect(() => {
    function onTheme(event: Event) {
      const detail = (
        event as CustomEvent<{ primary: string; secondary: string }>
      ).detail;
      if (!detail?.primary || !detail?.secondary) return;
      setPrimary(detail.primary);
      setSecondary(detail.secondary);
    }
    window.addEventListener(ADMIN_THEME_EVENT, onTheme);
    return () => window.removeEventListener(ADMIN_THEME_EVENT, onTheme);
  }, []);

  const duration = reduced ? 0.01 : 0.32;
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <QuickBookProvider>
    <div
      className={cn(
        "admin-shell flex h-screen overflow-hidden bg-[var(--admin-canvas)] text-[var(--admin-text)]",
        locale === "ar" && "font-[family-name:var(--font-arabic)]",
      )}
      style={{
        ["--admin-primary" as string]: primary,
        ["--admin-secondary" as string]: secondary,
      }}
    >
      <AdminIconRail />
      <AnimatePresence initial={false}>
        {!sidebarCollapsed ? (
          <motion.div
            key="admin-sidebar"
            className="hidden h-screen shrink-0 overflow-hidden lg:block"
            initial={
              reduced
                ? { width: SIDEBAR_WIDTH, opacity: 1 }
                : { width: 0, opacity: 0 }
            }
            animate={{ width: SIDEBAR_WIDTH, opacity: 1 }}
            exit={
              reduced
                ? { width: 0, opacity: 0 }
                : { width: 0, opacity: 0 }
            }
            transition={{ duration, ease }}
          >
            <AdminSidebar pendingCount={pendingCount} />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col p-2 md:p-2.5">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[var(--admin-border)] bg-[var(--admin-panel)]">
          <AdminTopbar
            pendingCount={pendingCount}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={isCustomize ? undefined : toggle}
          />
          <main
            className={cn(
              "flex min-h-0 flex-1 flex-col bg-[var(--admin-canvas)]",
              flushMain
                ? "overflow-hidden p-0"
                : "overflow-y-auto px-4 py-4 md:px-6 md:py-5",
            )}
          >
            {children}
          </main>
        </div>
      </div>
      {!isSupport ? (
        <AdminFloatingBubbles
          chatOpen={chatOpen}
          whatsappOpen={whatsappOpen}
          onChatOpen={() => {
            setWhatsappOpen(false);
            setChatOpen(true);
          }}
          onChatClose={() => setChatOpen(false)}
          onWhatsappOpen={() => {
            setChatOpen(false);
            setWhatsappOpen(true);
          }}
          onWhatsappClose={() => setWhatsappOpen(false)}
        />
      ) : null}
    </div>
    </QuickBookProvider>
  );
}
