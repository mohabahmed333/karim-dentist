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
import { WhatsappLiveBoot } from "./WhatsappLiveBoot";
import { QuickBookProvider } from "./quick-book/QuickBookProvider";
import { useAdminSidebarCollapse } from "@/features/admin/hooks/useAdminSidebarCollapse";
import { useAdminChatLayout } from "@/features/admin/hooks/useAdminChatLayout";
import { nextDockCollapsedOnLayoutToggle } from "@/features/admin/lib/adminChatDemoLayout";
import { shouldHideAdminChatBubbles } from "@/features/admin/lib/adminPatientPath";
import {
  DEFAULT_DASHBOARD_CANVAS,
  DEFAULT_DASHBOARD_PANEL,
  DEFAULT_DASHBOARD_PRIMARY,
  DEFAULT_DASHBOARD_SECONDARY,
} from "@/services/site_settings/dashboardTheme";
import { ADMIN_THEME_EVENT } from "@/features/admin/lib/adminThemeEvent";
import { ADMIN_OPEN_WHATSAPP_EVENT } from "@/features/admin/lib/adminShellEvents";
import type { AdminDemoInbox } from "@/features/admin/lib/adminDemoInbox";
import type { AdminChatLayout } from "@/features/admin/hooks/useAdminChatLayout";

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
  /** Offline showreel inbox — skips live WhatsApp boot when set. */
  demoInbox?: AdminDemoInbox | null;
  /** Showreel: Clinic Assist panel body (float/dock position). */
  demoAssistPanel?: ReactNode | null;
  /** Force float/dock for deterministic recording. */
  forceChatLayout?: AdminChatLayout;
  forceWhatsappOpen?: boolean;
  forceChatOpen?: boolean;
  forceDockCollapsed?: boolean;
  /** Hide bottom FAB/float (e.g. showreel uses full WhatsApp page). */
  hideFloatingBubbles?: boolean;
  /** Flush main padding like /admin/support. */
  forceFlushMain?: boolean;
  /** Showreel: override the persisted sidebar-collapse preference so
      recordings don't depend on the real app's localStorage state. */
  forceSidebarCollapsed?: boolean;
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
  demoInbox = null,
  demoAssistPanel = null,
  forceChatLayout,
  forceWhatsappOpen,
  forceChatOpen,
  forceDockCollapsed,
  hideFloatingBubbles = false,
  forceFlushMain = false,
  forceSidebarCollapsed,
}: Props) {
  const pathname = usePathname();
  const isCustomize = pathname.startsWith("/admin/customize");
  const isSupport = pathname.startsWith("/admin/support");
  const hideBubbles =
    hideFloatingBubbles || shouldHideAdminChatBubbles(pathname);
  const flushMain = isCustomize || isSupport || forceFlushMain;
  const { locale } = useLocale();
  const reduced = useReducedMotion();
  const { collapsed, toggle, ready: sidebarReady } = useAdminSidebarCollapse();
  const {
    layout: storedChatLayout,
    toggleLayout: toggleChatLayout,
    dockCollapsed: storedDockCollapsed,
    setDockCollapsed,
    expandDock,
  } = useAdminChatLayout();
  const isDemoChat = forceChatLayout !== undefined;
  /** When forceChatLayout is set, keep a local copy so float⇄dock still works in demos. */
  const [demoChatLayout, setDemoChatLayout] = useState<AdminChatLayout | null>(
    forceChatLayout ?? null,
  );
  const [demoDockCollapsed, setDemoDockCollapsed] = useState(
    forceDockCollapsed ?? false,
  );
  useEffect(() => {
    setDemoChatLayout(forceChatLayout ?? null);
  }, [forceChatLayout]);
  useEffect(() => {
    if (forceDockCollapsed === undefined) return;
    setDemoDockCollapsed(forceDockCollapsed);
  }, [forceDockCollapsed]);
  const chatLayout = demoChatLayout ?? storedChatLayout;
  const dockCollapsed = isDemoChat ? demoDockCollapsed : storedDockCollapsed;
  function handleToggleChatLayout() {
    if (demoChatLayout !== null) {
      const next = demoChatLayout === "float" ? "dock" : "float";
      setDemoChatLayout(next);
      setDemoDockCollapsed(
        nextDockCollapsedOnLayoutToggle(next, demoDockCollapsed),
      );
      return;
    }
    toggleChatLayout();
  }
  function handleExpandDock() {
    if (isDemoChat) setDemoDockCollapsed(false);
    else expandDock();
  }
  function handleCollapseDock() {
    if (isDemoChat) setDemoDockCollapsed(true);
    else setDockCollapsed(true);
  }
  // Hide until localStorage is read so reload never flashes open → closed.
  const sidebarCollapsed =
    forceSidebarCollapsed ?? (isCustomize || !sidebarReady || collapsed);
  const [sidebarMotionReady, setSidebarMotionReady] = useState(false);
  const [primary, setPrimary] = useState(primaryColor);
  const [secondary, setSecondary] = useState(secondaryColor);
  const [canvas, setCanvas] = useState(canvasColor);
  const [content, setContent] = useState(contentColor);
  const [chatOpen, setChatOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  useEffect(() => {
    if (forceWhatsappOpen === undefined) return;
    setWhatsappOpen(forceWhatsappOpen);
    if (forceWhatsappOpen) setChatOpen(false);
  }, [forceWhatsappOpen]);

  useEffect(() => {
    if (forceChatOpen === undefined) return;
    setChatOpen(forceChatOpen);
    if (forceChatOpen) setWhatsappOpen(false);
  }, [forceChatOpen]);

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
    {demoInbox ? null : <WhatsappLiveBoot />}
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
      {!hideBubbles ? (
        <AdminFloatingBubbles
          chatOpen={chatOpen}
          whatsappOpen={whatsappOpen}
          onChatOpen={() => {
            setWhatsappOpen(false);
            setChatOpen(true);
            if (chatLayout === "dock") handleExpandDock();
          }}
          onChatClose={() => setChatOpen(false)}
          onWhatsappOpen={() => {
            setChatOpen(false);
            setWhatsappOpen(true);
            if (chatLayout === "dock") handleExpandDock();
          }}
          onWhatsappClose={() => setWhatsappOpen(false)}
          layout={chatLayout}
          dockCollapsed={dockCollapsed}
          onToggleLayout={handleToggleChatLayout}
          onCollapseDock={handleCollapseDock}
          onExpandDock={handleExpandDock}
          demoInbox={demoInbox}
          demoAssistPanel={demoAssistPanel}
        />
      ) : null}
    </div>
    </QuickBookProvider>
  );
}
