"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessagesSquare } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { SupportInboxView } from "@/features/admin/components/support";
import { ReceptionChat } from "@/features/admin/components/chat/reception/ReceptionChat";
import { AdminBubbleChooser } from "./AdminBubbleChooser";
import { AdminChatDockRail } from "./AdminChatDockRail";
import { AdminChatDockPaneSkeleton } from "./AdminChatDockPaneSkeleton";
import {
  AdminChatDockTabs,
  type DockChatTab,
} from "./AdminChatDockTabs";
import {
  DOCK_TAB_SKELETON_MS,
  dockTabTransition,
  dockTabVariants,
} from "./dockTabMotion";
import type { AdminChatLayout } from "@/features/admin/hooks/useAdminChatLayout";
import { ChatUnreadBadge } from "./ChatUnreadBadge";
import { formatUnreadBadge } from "@/features/admin/lib/whatsappInboundAlert";
import { dispatchCloseCommandPalette } from "@/features/admin/lib/adminShellEvents";
import type { AdminDemoInbox } from "@/features/admin/lib/adminDemoInbox";

type Props = {
  chatOpen: boolean;
  whatsappOpen: boolean;
  onChatOpen: () => void;
  onChatClose: () => void;
  onWhatsappOpen: () => void;
  onWhatsappClose: () => void;
  layout: AdminChatLayout;
  dockCollapsed: boolean;
  onToggleLayout: () => void;
  onCollapseDock: () => void;
  onExpandDock: () => void;
  demoInbox?: AdminDemoInbox | null;
  /** Showreel: replace Clinic Assist body (keeps float/dock chrome). */
  demoAssistPanel?: ReactNode | null;
};

const DOCK_WIDTH = 420;
const LG_QUERY = "(min-width: 1024px)";
const DOCK_TAB_KEY = "admin-chat-dock-tab";

const floatPanelClass =
  "pointer-events-auto admin-card flex h-[min(42rem,calc(100dvh-7.5rem))] w-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--admin-border)] shadow-[0_12px_40px_rgba(0,0,0,0.12)] sm:w-[min(26.5rem,calc(100vw-2rem))]";

const dockPanelClass =
  "flex h-full min-h-0 w-full flex-col overflow-hidden border-s border-[var(--admin-border)] bg-[var(--admin-panel)]";

function subscribeLg(onChange: () => void) {
  const mq = window.matchMedia(LG_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getLgSnapshot() {
  return window.matchMedia(LG_QUERY).matches;
}

function getLgServerSnapshot() {
  return true;
}

function readStoredTab(): DockChatTab {
  try {
    const v = localStorage.getItem(DOCK_TAB_KEY);
    if (v === "assist" || v === "whatsapp") return v;
  } catch {
    /* ignore */
  }
  return "whatsapp";
}

function writeStoredTab(tab: DockChatTab) {
  try {
    localStorage.setItem(DOCK_TAB_KEY, tab);
  } catch {
    /* ignore */
  }
}

/** One launcher FAB; pick WhatsApp or Clinic Assist. Float or right-dock. */
export function AdminFloatingBubbles({
  chatOpen,
  whatsappOpen,
  onChatOpen,
  onChatClose,
  onWhatsappOpen,
  onWhatsappClose,
  layout,
  dockCollapsed,
  onToggleLayout,
  onCollapseDock,
  onExpandDock,
  demoInbox = null,
  demoAssistPanel = null,
}: Props) {
  const t = useTranslations();
  const reduced = useReducedMotion();
  const isLg = useSyncExternalStore(
    subscribeLg,
    getLgSnapshot,
    getLgServerSnapshot,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [dockTab, setDockTab] = useState<DockChatTab>("whatsapp");
  const [tabDir, setTabDir] = useState(1);
  const [tabLoading, setTabLoading] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const unreadLabel = formatUnreadBadge(unreadTotal);
  const menuRef = useRef<HTMLDivElement>(null);
  const docked = layout === "dock";
  const useSideDock = docked && isLg;
  const anyOpen = chatOpen || whatsappOpen;
  const showDockColumn = useSideDock && anyOpen && !dockCollapsed;
  const showDockRail = useSideDock && (!anyOpen || dockCollapsed);
  const tabVariants = useMemo(() => dockTabVariants(), []);
  const tabTransition = dockTabTransition(reduced);

  useEffect(() => {
    setDockTab(readStoredTab());
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  useEffect(() => {
    if (!showDockRail) setMenuOpen(false);
  }, [showDockRail]);

  useEffect(() => {
    if (!tabLoading) return;
    const ms = reduced ? 40 : DOCK_TAB_SKELETON_MS;
    const id = window.setTimeout(() => setTabLoading(false), ms);
    return () => window.clearTimeout(id);
  }, [tabLoading, dockTab, reduced]);

  // Keep dock tab in sync when parent opens a specific chat.
  useEffect(() => {
    if (!useSideDock) return;
    if (whatsappOpen && !chatOpen) {
      setDockTab("whatsapp");
      writeStoredTab("whatsapp");
    } else if (chatOpen && !whatsappOpen) {
      setDockTab("assist");
      writeStoredTab("assist");
    }
  }, [useSideDock, whatsappOpen, chatOpen]);

  function beginTabChange(next: DockChatTab, from: DockChatTab) {
    if (next !== from) {
      setTabDir(next === "assist" ? 1 : -1);
      setTabLoading(true);
    }
    setDockTab(next);
    writeStoredTab(next);
  }

  function openWhatsapp() {
    setMenuOpen(false);
    beginTabChange("whatsapp", dockTab);
    if (docked) onExpandDock();
    onWhatsappOpen();
  }

  function openAssist() {
    setMenuOpen(false);
    beginTabChange("assist", dockTab);
    if (docked) onExpandDock();
    onChatOpen();
  }

  function selectDockTab(tab: DockChatTab) {
    if (tab === dockTab && anyOpen && !dockCollapsed) return;
    beginTabChange(tab, dockTab);
    onExpandDock();
    if (tab === "whatsapp") onWhatsappOpen();
    else onChatOpen();
  }

  function openDockFromRail() {
    dispatchCloseCommandPalette();
    const tab = readStoredTab();
    setTabDir(tab === "assist" ? 1 : -1);
    setTabLoading(true);
    setDockTab(tab);
    writeStoredTab(tab);
    onExpandDock();
    if (tab === "assist") onChatOpen();
    else onWhatsappOpen();
  }

  const layoutProps = {
    chatLayout: layout,
    onToggleChatLayout: onToggleLayout,
    onCollapseDock: docked ? onCollapseDock : undefined,
  };

  function renderAssistPanel(onClose: () => void) {
    if (!demoAssistPanel) {
      return (
        <ReceptionChat
          className="h-full min-h-0"
          onClose={onClose}
          {...layoutProps}
        />
      );
    }
    if (isValidElement(demoAssistPanel)) {
      return cloneElement(
        demoAssistPanel as ReactElement<Record<string, unknown>>,
        {
          chatLayout: layout,
          onToggleChatLayout: onToggleLayout,
          onCollapseDock: docked ? onCollapseDock : undefined,
          onClose,
        },
      );
    }
    return demoAssistPanel;
  }

  const inboxDemoProps = demoInbox
    ? {
        useKapso: false as const,
        conversations: demoInbox.conversations,
        detailsById: demoInbox.detailsById,
        messagesById: demoInbox.messagesById,
        openCount: demoInbox.openCount ?? demoInbox.conversations.length,
        forcedSelectedId: demoInbox.forcedSelectedId,
      }
    : { useKapso: true as const };

  function renderFab() {
    return (
      <div ref={menuRef} className="pointer-events-auto relative">
        {menuOpen ? (
          <AdminBubbleChooser
            onWhatsapp={openWhatsapp}
            onAssist={openAssist}
          />
        ) : null}

        <button
          type="button"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          data-showreel-action="chat-fab"
          aria-label={
            unreadLabel
              ? `${t("admin.bubbles.open")}, ${unreadLabel} ${t("admin.bubbles.unread")}`
              : t("admin.bubbles.open")
          }
          onClick={() => {
            dispatchCloseCommandPalette();
            setMenuOpen((v) => !v);
          }}
          className="relative flex size-12 items-center justify-center rounded-full text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-transform hover:scale-105 sm:size-14"
          style={{ background: "var(--admin-primary)" }}
        >
          <MessagesSquare className="size-5 sm:size-6" />
          <ChatUnreadBadge label={unreadLabel} />
        </button>
      </div>
    );
  }

  // Side dock: rail opens panel with WhatsApp | AI tabs.
  if (useSideDock) {
    return (
      <>
        <motion.aside
          className="relative h-screen shrink-0 overflow-hidden"
          initial={false}
          animate={{
            width: showDockColumn ? DOCK_WIDTH : 0,
            opacity: showDockColumn ? 1 : 0,
          }}
          transition={{
            duration: reduced ? 0.01 : 0.28,
            ease: [0.22, 1, 0.36, 1],
          }}
          aria-hidden={!showDockColumn}
          inert={!showDockColumn}
          style={{ pointerEvents: showDockColumn ? "auto" : "none" }}
        >
              <div className={cn(dockPanelClass, "bg-[var(--admin-panel)]")}>
                <AdminChatDockTabs
                  tab={dockTab}
                  onTabChange={selectDockTab}
                  onCollapse={onCollapseDock}
                  chatLayout={layout}
                  onToggleChatLayout={onToggleLayout}
                />
                <div className="relative min-h-0 flex-1 overflow-hidden">
                  {/* Keep both panes mounted so WhatsApp realtime survives tab switches. */}
                  <motion.div
                    className="absolute inset-0 flex min-h-0 flex-col"
                    initial={false}
                    animate={
                      dockTab === "whatsapp" && !tabLoading
                        ? { x: 0, opacity: 1 }
                        : { x: tabDir > 0 ? "-10%" : "10%", opacity: 0 }
                    }
                    transition={tabTransition}
                    style={{
                      pointerEvents:
                        dockTab === "whatsapp" && !tabLoading ? "auto" : "none",
                    }}
                    aria-hidden={dockTab !== "whatsapp" || tabLoading}
                  >
                    <SupportInboxView
                      {...inboxDemoProps}
                      compact
                      showClinicAssist={false}
                      onClose={onCollapseDock}
                      agentName={t("admin.frontDesk.agentName")}
                      panelVisible={
                        showDockColumn && dockTab === "whatsapp"
                      }
                      onUnreadTotal={setUnreadTotal}
                    />
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 flex min-h-0 flex-col"
                    initial={false}
                    animate={
                      dockTab === "assist" && !tabLoading
                        ? { x: 0, opacity: 1 }
                        : { x: tabDir > 0 ? "10%" : "-10%", opacity: 0 }
                    }
                    transition={tabTransition}
                    style={{
                      pointerEvents:
                        dockTab === "assist" && !tabLoading ? "auto" : "none",
                    }}
                    aria-hidden={dockTab !== "assist" || tabLoading}
                  >
                    {renderAssistPanel(onCollapseDock)}
                  </motion.div>
                  <AnimatePresence initial={false} custom={tabDir}>
                    {tabLoading ? (
                      <motion.div
                        key={`skel-${dockTab}`}
                        custom={tabDir}
                        variants={tabVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={tabTransition}
                        className="absolute inset-0 z-[1] bg-[var(--admin-panel)]"
                      >
                        <AdminChatDockPaneSkeleton tab={dockTab} />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
        </motion.aside>

        {showDockRail ? (
          <div className="relative z-[100] h-screen shrink-0">
            <AdminChatDockRail
              label={t("admin.bubbles.dockLabel")}
              unreadLabel={unreadLabel}
              onActivate={openDockFromRail}
            />
          </div>
        ) : null}
      </>
    );
  }

  // Float (or dock preference on small screens).
  return (
    <div className="pointer-events-none fixed inset-x-2 bottom-2 z-[100] flex flex-col items-end gap-3 sm:inset-x-auto sm:end-4 sm:bottom-4 md:end-6 md:bottom-6">
      <div
        className={cn(
          floatPanelClass,
          "bg-[var(--admin-panel)]",
          !whatsappOpen && "hidden",
        )}
        aria-hidden={!whatsappOpen}
        inert={!whatsappOpen}
        data-showreel-action="whatsapp-panel"
      >
        <SupportInboxView
          key={
            demoInbox?.forcedSelectedId
              ? `demo-${demoInbox.forcedSelectedId}`
              : "live-whatsapp"
          }
          {...inboxDemoProps}
          compact
          showClinicAssist={false}
          onClose={onWhatsappClose}
          agentName={t("admin.frontDesk.agentName")}
          panelVisible={whatsappOpen}
          onUnreadTotal={setUnreadTotal}
          {...layoutProps}
        />
      </div>
      <div
        className={cn(
          floatPanelClass,
          "bg-[var(--admin-panel)]",
          !chatOpen && "hidden",
        )}
        aria-hidden={!chatOpen}
        data-showreel-action="assist-panel"
      >
        {renderAssistPanel(onChatClose)}
      </div>
      {renderFab()}
    </div>
  );
}
