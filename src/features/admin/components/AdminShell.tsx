"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AdminIconRail } from "./AdminIconRail";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { AdminBillingAlerts } from "./AdminBillingAlerts";
import { AdminFloatingBubbles } from "./AdminFloatingBubbles";
import { AdminFloatingNotes } from "./notes/AdminFloatingNotes";
import { WhatsappLiveBoot } from "./WhatsappLiveBoot";
import { QuickBookProvider } from "./quick-book/QuickBookProvider";
import { useAdminSidebarCollapse } from "@/features/admin/hooks/useAdminSidebarCollapse";
import { useAdminDarkMode } from "@/features/admin/hooks/useAdminDarkMode";
import { useAdminChatLayout } from "@/features/admin/hooks/useAdminChatLayout";
import { nextDockCollapsedOnLayoutToggle } from "@/features/admin/lib/adminChatDemoLayout";
import { shouldHideAdminChatBubbles } from "@/features/admin/lib/adminPatientPath";
import {
  DARK_DASHBOARD_CANVAS,
  DARK_DASHBOARD_PANEL,
  DEFAULT_DASHBOARD_CANVAS,
  DEFAULT_DASHBOARD_PANEL,
  DEFAULT_DASHBOARD_PRIMARY,
  DEFAULT_DASHBOARD_SECONDARY,
} from "@/services/site_settings/dashboardTheme";
import { ADMIN_THEME_EVENT } from "@/features/admin/lib/adminThemeEvent";
import {
  ADMIN_OPEN_WHATSAPP_EVENT,
  type OpenWhatsappDetail,
} from "@/features/admin/lib/adminShellEvents";
import type { AdminDemoInbox } from "@/features/admin/lib/adminDemoInbox";
import type { AdminChatLayout } from "@/features/admin/hooks/useAdminChatLayout";
import type { AdminNotificationGroup } from "@/services/admin_notifications/groups";

const SIDEBAR_WIDTH = 220;

type ThemeDetail = {
  primary: string;
  secondary: string;
  canvas: string;
  /** Main content area behind cards — not card chrome. */
  content: string;
  panel: string;
};

type Props = {
  children: ReactNode;
  navBadges?: Record<string, number>;
  /** What the topbar bell lists, already filtered to this user. */
  notifications?: AdminNotificationGroup[];
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
  /** Permission keys granted to the current session; omit to show all nav (demos). */
  permissions?: string[] | null;
};

function applyRootThemeVars(theme: ThemeDetail) {
  const root = document.documentElement;
  root.style.setProperty("--admin-primary", theme.primary);
  root.style.setProperty("--admin-secondary", theme.secondary);
  root.style.setProperty("--admin-canvas", theme.canvas);
  root.style.setProperty("--admin-content", theme.content);
  root.style.setProperty("--admin-panel", theme.panel);
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
  navBadges = {},
  notifications = [],
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
  permissions,
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
  const { darkMode, toggle: toggleDarkMode } = useAdminDarkMode();
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
  // Conversation the panel should jump to, when it was opened for one patient
  // rather than for the inbox at large.
  const [whatsappConversationId, setWhatsappConversationId] = useState<
    string | undefined
  >(undefined);

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
    function onOpenWhatsapp(event: Event) {
      if (pathname.startsWith("/admin/support")) return;
      const detail = (event as CustomEvent<OpenWhatsappDetail>).detail;
      setChatOpen(false);
      setWhatsappOpen(true);
      setWhatsappConversationId(detail?.conversationId);
      // A collapsed dock renders a zero-width column, so setting `whatsappOpen`
      // alone puts the panel in a state nobody can see — the same reason both
      // bubble handlers below expand it. Without this, "WhatsApp" on a patient
      // reads as a dead button on any wide screen using the dock layout.
      if (chatLayout === "dock") handleExpandDock();
    }
    window.addEventListener(ADMIN_OPEN_WHATSAPP_EVENT, onOpenWhatsapp);
    return () =>
      window.removeEventListener(ADMIN_OPEN_WHATSAPP_EVENT, onOpenWhatsapp);
    // `handleExpandDock` is re-created every render; `chatLayout`/`isDemoChat`
    // are what actually change its behaviour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, chatLayout, isDemoChat]);

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

  // Dark mode overrides canvas/content/panel to fixed dark defaults, ignoring the
  // customized (light) DB values; primary/secondary brand colors pass through unchanged.
  const effectiveCanvas = darkMode ? DARK_DASHBOARD_CANVAS : canvas;
  const effectiveContent = darkMode ? DARK_DASHBOARD_CANVAS : content;
  const effectivePanel = darkMode ? DARK_DASHBOARD_PANEL : DEFAULT_DASHBOARD_PANEL;

  useEffect(() => {
    applyRootThemeVars({
      primary,
      secondary,
      canvas: effectiveCanvas,
      content: effectiveContent,
      panel: effectivePanel,
    });
    return () => clearRootThemeVars();
  }, [primary, secondary, effectiveCanvas, effectiveContent, effectivePanel]);

  const duration = reduced ? 0.01 : 0.32;
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <QuickBookProvider>
    {demoInbox ? null : <WhatsappLiveBoot />}
    <div
      className={cn(
        "admin-shell flex h-screen overflow-hidden bg-[var(--admin-canvas)] text-[var(--admin-text)]",
        locale === "ar" && "font-[family-name:var(--font-arabic)]",
        darkMode && "dark",
      )}
      style={{
        ["--admin-primary" as string]: primary,
        ["--admin-secondary" as string]: secondary,
        ["--admin-canvas" as string]: effectiveCanvas,
        ["--admin-content" as string]: effectiveContent,
        ["--admin-panel" as string]: effectivePanel,
      }}
    >
      {/* Shell-level, so a bill announces itself wherever the front desk is. */}
      <AdminBillingAlerts
        canCollect={(permissions ?? []).includes("patients.billing.edit")}
        canSeeBookings={(permissions ?? []).includes("reservations.view")}
        canSeeInventory={(permissions ?? []).includes("inventory.view")}
      />
      <AdminIconRail permissions={permissions} sidebarCollapsed={sidebarCollapsed} />
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
            <AdminSidebar navBadges={navBadges} permissions={permissions} />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col p-2 md:p-2.5">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[var(--admin-border)] bg-[var(--admin-panel)]">
          <AdminTopbar
            navBadges={navBadges}
            notifications={notifications}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={isCustomize ? undefined : toggle}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
            permissions={permissions}
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
          whatsappConversationId={whatsappConversationId}
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
          onWhatsappClose={() => {
            setWhatsappOpen(false);
            // Forget the target, so reopening from the bubble returns to the
            // inbox rather than snapping back to one patient's thread.
            setWhatsappConversationId(undefined);
          }}
          layout={chatLayout}
          dockCollapsed={dockCollapsed}
          onToggleLayout={handleToggleChatLayout}
          onCollapseDock={handleCollapseDock}
          onExpandDock={handleExpandDock}
          demoInbox={demoInbox}
          demoAssistPanel={demoAssistPanel}
        />
      ) : null}
      <AdminFloatingNotes />
    </div>
    </QuickBookProvider>
  );
}
