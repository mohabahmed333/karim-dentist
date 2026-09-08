"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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
          aria-label={t("admin.bubbles.open")}
          onClick={() => setMenuOpen((v) => !v)}
          className="flex size-12 items-center justify-center rounded-full text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-transform hover:scale-105 sm:size-14"
          style={{ background: "var(--admin-primary)" }}
        >
          <MessagesSquare className="size-5 sm:size-6" />
        </button>
      </div>
    );
  }

  // Side dock: rail opens panel with WhatsApp | AI tabs.
  if (useSideDock) {
    return (
      <>
        <AnimatePresence initial={false}>
          {showDockColumn ? (
            <motion.aside
              key="admin-chat-dock"
              className="relative h-screen shrink-0"
              initial={reduced ? false : { width: 0, opacity: 0 }}
              animate={{ width: DOCK_WIDTH, opacity: 1 }}
              exit={reduced ? undefined : { width: 0, opacity: 0 }}
              transition={{
                duration: reduced ? 0.01 : 0.28,
                ease: [0.22, 1, 0.36, 1],
              }}
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
                      useKapso
                      compact
                      showClinicAssist={false}
                      onClose={onCollapseDock}
                      agentName={t("admin.frontDesk.agentName")}
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
                    <ReceptionChat
                      className="h-full min-h-0"
                      statsSummary={t("admin.chat.title")}
                      onClose={onCollapseDock}
                    />
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
          ) : null}
        </AnimatePresence>

        {showDockRail ? (
          <div className="relative h-screen shrink-0">
            <AdminChatDockRail
              label={t("admin.bubbles.dockLabel")}
              onActivate={openDockFromRail}
            />
          </div>
        ) : null}
      </>
    );
  }

  // Float (or dock preference on small screens).
  return (
    <div className="pointer-events-none fixed inset-x-2 bottom-2 z-[70] flex flex-col items-end gap-3 sm:inset-x-auto sm:end-4 sm:bottom-4 md:end-6 md:bottom-6">
      <div
        className={cn(
          floatPanelClass,
          "bg-[var(--admin-panel)]",
          !whatsappOpen && "hidden",
        )}
        aria-hidden={!whatsappOpen}
      >
        <SupportInboxView
          useKapso
          compact
          showClinicAssist={false}
          onClose={onWhatsappClose}
          agentName={t("admin.frontDesk.agentName")}
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
      >
        <ReceptionChat
          className="h-full min-h-0"
          statsSummary={t("admin.chat.title")}
          onClose={onChatClose}
          {...layoutProps}
        />
      </div>
      {renderFab()}
    </div>
  );
}
