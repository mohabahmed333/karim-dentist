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
import { useAdminChatLayout } from "@/features/admin/hooks/useAdminChatLayout";
import {
  DEFAULT_DASHBOARD_CANVAS,
  DEFAULT_DASHBOARD_PANEL,
  DEFAULT_DASHBOARD_PRIMARY,
  DEFAULT_DASHBOARD_SECONDARY,
} from "@/services/site_settings/dashboardTheme";
import { ADMIN_THEME_EVENT } from "@/features/admin/lib/adminThemeEvent";
import { ADMIN_OPEN_WHATSAPP_EVENT } from "@/features/admin/lib/adminShellEvents";

const SIDEBAR_WIDTH = 220;

type ThemeDetail = {
  primary: string;
  secondary: string;
  canvas: string;
  /** Main content area behind cards — not card chrome. */
  content: string;
};

type Props = {
  children: ReactNode;
  pendingCount?: number;
  primaryColor?: string;
  secondaryColor?: string;
  canvasColor?: string;
  /** Maps from site_settings.dashboard_panel_color → --admin-content */
  contentColor?: string;
};

function applyRootThemeVars(theme: ThemeDetail) {
  const root = document.documentElement;
  root.style.setProperty("--admin-primary", theme.primary);
  root.style.setProperty("--admin-secondary", theme.secondary);
  root.style.setProperty("--admin-canvas", theme.canvas);
  root.style.setProperty("--admin-content", theme.content);
  // Cards / chrome stay white — not driven by content color.
  root.style.setProperty("--admin-panel", DEFAULT_DASHBOARD_PANEL);
}

function clearRootThemeVars() {
  const root = document.documentElement;
  root.style.removeProperty("--admin-primary");
  root.style.removeProperty("--admin-secondary");
  root.style.removeProperty("--admin-canvas");
  root.style.removeProperty("--admin-content");
  root.style.removeProperty("--admin-panel");
}

export function AdminShell({
  children,
  pendingCount = 0,
  primaryColor = DEFAULT_DASHBOARD_PRIMARY,
  secondaryColor = DEFAULT_DASHBOARD_SECONDARY,
  canvasColor = DEFAULT_DASHBOARD_CANVAS,
  contentColor = DEFAULT_DASHBOARD_CANVAS,
}: Props) {
  const pathname = usePathname();
  const isCustomize = pathname.startsWith("/admin/customize");
  const isSupport = pathname.startsWith("/admin/support");
  const flushMain = isCustomize || isSupport;
  const { locale } = useLocale();
  const reduced = useReducedMotion();
  const { collapsed, toggle, ready: sidebarReady } = useAdminSidebarCollapse();
  const {
    layout: chatLayout,
    toggleLayout: toggleChatLayout,
    dockCollapsed,
    setDockCollapsed,
    expandDock,
  } = useAdminChatLayout();
  // Hide until localStorage is read so reload never flashes open → closed.
  const sidebarCollapsed = isCustomize || !sidebarReady || collapsed;
  const [sidebarMotionReady, setSidebarMotionReady] = useState(false);
  const [primary, setPrimary] = useState(primaryColor);
  const [secondary, setSecondary] = useState(secondaryColor);
  const [canvas, setCanvas] = useState(canvasColor);
  const [content, setContent] = useState(contentColor);
  const [chatOpen, setChatOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  useEffect(() => {
    if (!sidebarReady) return;
    const id = requestAnimationFrame(() => setSidebarMotionReady(true));
    return () => cancelAnimationFrame(id);
  }, [sidebarReady]);

  useEffect(() => {
    if (isSupport) {
      setChatOpen(false);
      setWhatsappOpen(false);
    }
  }, [isSupport]);

  useEffect(() => {
    function onOpenWhatsapp() {
      if (pathname.startsWith("/admin/support")) return;
      setChatOpen(false);
      setWhatsappOpen(true);
    }
    window.addEventListener(ADMIN_OPEN_WHATSAPP_EVENT, onOpenWhatsapp);
    return () =>
      window.removeEventListener(ADMIN_OPEN_WHATSAPP_EVENT, onOpenWhatsapp);
  }, [pathname]);

  useEffect(() => {
    setPrimary(primaryColor);
    setSecondary(secondaryColor);
    setCanvas(canvasColor);
    setContent(contentColor);
  }, [primaryColor, secondaryColor, canvasColor, contentColor]);

  useEffect(() => {
    function onTheme(event: Event) {
      const detail = (event as CustomEvent<ThemeDetail>).detail;
      if (
        !detail?.primary ||
        !detail?.secondary ||
        !detail?.canvas ||
        !detail?.content
      ) {
        return;
      }
      setPrimary(detail.primary);
      setSecondary(detail.secondary);
      setCanvas(detail.canvas);
      setContent(detail.content);
    }
    window.addEventListener(ADMIN_THEME_EVENT, onTheme);
    return () => window.removeEventListener(ADMIN_THEME_EVENT, onTheme);
  }, []);

  useEffect(() => {
    applyRootThemeVars({ primary, secondary, canvas, content });
    return () => clearRootThemeVars();
  }, [primary, secondary, canvas, content]);

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
        ["--admin-canvas" as string]: canvas,
        ["--admin-content" as string]: content,
        ["--admin-panel" as string]: DEFAULT_DASHBOARD_PANEL,
      }}
    >
      <AdminIconRail />
      <AnimatePresence initial={false}>
        {!sidebarCollapsed ? (
          <motion.div
            key="admin-sidebar"
            className="hidden h-screen shrink-0 overflow-hidden lg:block"
            initial={
              !sidebarMotionReady || reduced
                ? false
                : { width: 0, opacity: 0 }
            }
            animate={{ width: SIDEBAR_WIDTH, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
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
              "flex min-h-0 flex-1 flex-col bg-[var(--admin-content)]",
              flushMain
                ? "overflow-hidden p-0"
                : "overflow-x-hidden overflow-y-auto px-4 py-4 md:px-6 md:py-5",
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
            if (chatLayout === "dock") expandDock();
          }}
          onChatClose={() => setChatOpen(false)}
          onWhatsappOpen={() => {
            setChatOpen(false);
            setWhatsappOpen(true);
            if (chatLayout === "dock") expandDock();
          }}
          onWhatsappClose={() => setWhatsappOpen(false)}
          layout={chatLayout}
          dockCollapsed={dockCollapsed}
          onToggleLayout={toggleChatLayout}
          onCollapseDock={() => setDockCollapsed(true)}
          onExpandDock={expandDock}
        />
      ) : null}
    </div>
    </QuickBookProvider>
  );
}
