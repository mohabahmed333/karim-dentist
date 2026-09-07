"use client";

import { useEffect, useRef, useState } from "react";
import { MessagesSquare } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { SupportInboxView } from "@/features/admin/components/support";
import { ReceptionChat } from "@/features/admin/components/chat/reception/ReceptionChat";
import { AdminBubbleChooser } from "./AdminBubbleChooser";

type Props = {
  chatOpen: boolean;
  whatsappOpen: boolean;
  onChatOpen: () => void;
  onChatClose: () => void;
  onWhatsappOpen: () => void;
  onWhatsappClose: () => void;
};

const panelClass =
  "pointer-events-auto admin-card flex h-[min(42rem,calc(100dvh-7.5rem))] w-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--admin-border)] shadow-[0_12px_40px_rgba(0,0,0,0.12)] sm:w-[min(26.5rem,calc(100vw-2rem))]";

/** One launcher FAB; pick WhatsApp or Clinic Assist. Panels stay mounted. */
export function AdminFloatingBubbles({
  chatOpen,
  whatsappOpen,
  onChatOpen,
  onChatClose,
  onWhatsappOpen,
  onWhatsappClose,
}: Props) {
  const t = useTranslations();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="pointer-events-none fixed inset-x-2 bottom-2 z-[70] flex flex-col items-end gap-3 sm:inset-x-auto sm:end-4 sm:bottom-4 md:end-6 md:bottom-6">
      <div
        className={cn(panelClass, "bg-white", !whatsappOpen && "hidden")}
        aria-hidden={!whatsappOpen}
      >
        <SupportInboxView
          useKapso
          compact
          showClinicAssist={false}
          onClose={onWhatsappClose}
          agentName={t("admin.frontDesk.agentName")}
        />
      </div>

      <div
        className={cn(
          panelClass,
          "bg-[var(--admin-panel)]",
          !chatOpen && "hidden",
        )}
        aria-hidden={!chatOpen}
      >
        <ReceptionChat
          className="h-full min-h-0"
          statsSummary={t("admin.chat.title")}
          onClose={onChatClose}
        />
      </div>

      <div ref={menuRef} className="pointer-events-auto relative">
        {menuOpen ? (
          <AdminBubbleChooser
            onWhatsapp={() => {
              setMenuOpen(false);
              onWhatsappOpen();
            }}
            onAssist={() => {
              setMenuOpen(false);
              onChatOpen();
            }}
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
    </div>
  );
}
