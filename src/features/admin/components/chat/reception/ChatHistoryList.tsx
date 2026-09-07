"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "@/lib/i18n";
import type { ClinicChatThreadSummary } from "@/services/clinic_chat";
import { CHAT_META } from "../chatSkin";
import {
  chatTransition,
  chipItemVariants,
  chipListVariants,
} from "../chatMotion";

type Props = {
  threads: ClinicChatThreadSummary[];
  activeThreadId: string | null;
  onOpen: (threadId: string) => void;
  onNew: () => void;
  onBack?: () => void;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatHistoryList({
  threads,
  activeThreadId,
  onOpen,
  onNew,
  onBack,
}: Props) {
  const t = useTranslations();
  const reduced = useReducedMotion();
  const withActivity = threads.filter((thread) => thread.message_count > 1);

  return (
    <motion.div
      className="flex min-h-0 flex-1 flex-col"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={chatTransition(reduced)}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[var(--admin-border)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          {onBack ? (
            <motion.button
              type="button"
              whileTap={reduced ? undefined : { scale: 0.96 }}
              onClick={onBack}
              className="rounded-md px-2 py-1 text-[11px] font-medium text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
            >
              {t("admin.chat.back")}
            </motion.button>
          ) : null}
          <p className={`text-[12px] ${CHAT_META}`}>
            {withActivity.length === 1
              ? t("admin.chat.savedChatOne").replace("{count}", "1")
              : t("admin.chat.savedChats").replace(
                  "{count}",
                  String(withActivity.length),
                )}
          </p>
        </div>
        <motion.button
          type="button"
          whileHover={reduced ? undefined : { scale: 1.03 }}
          whileTap={reduced ? undefined : { scale: 0.96 }}
          onClick={onNew}
          className="rounded-md bg-[var(--admin-primary)] px-2.5 py-1 text-[11px] font-semibold text-white"
        >
          {t("admin.chat.newChat")}
        </motion.button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {withActivity.length === 0 ? (
          <p className={`px-2 py-10 text-center text-[12px] ${CHAT_META}`}>
            {t("admin.chat.noHistoryYet")}
          </p>
        ) : (
          <motion.ul
            className="space-y-1"
            variants={chipListVariants}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence initial={false}>
              {withActivity.map((thread) => {
                const active = thread.id === activeThreadId;
                return (
                  <motion.li
                    key={thread.id}
                    variants={chipItemVariants}
                    transition={chatTransition(reduced, 0.22)}
                    layout={!reduced}
                  >
                    <motion.button
                      type="button"
                      whileHover={reduced ? undefined : { scale: 1.01 }}
                      whileTap={reduced ? undefined : { scale: 0.985 }}
                      onClick={() => onOpen(thread.id)}
                      className={`w-full rounded-lg border px-3 py-2.5 text-start transition-colors ${
                        active
                          ? "border-[var(--admin-primary)] bg-[var(--admin-active)]"
                          : "border-transparent hover:bg-[var(--admin-hover)]"
                      }`}
                    >
                      <p className="truncate text-[13px] font-semibold text-[var(--admin-text)]">
                        {thread.title || t("admin.chat.defaultTitle")}
                      </p>
                      {thread.preview ? (
                        <p className={`mt-0.5 truncate text-[11px] ${CHAT_META}`}>
                          {thread.preview}
                        </p>
                      ) : null}
                      <p className={`mt-1 text-[10px] ${CHAT_META}`}>
                        {formatWhen(thread.updated_at)} ·{" "}
                        {t("admin.chat.messagesCount").replace(
                          "{count}",
                          String(thread.message_count),
                        )}
                      </p>
                    </motion.button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>
    </motion.div>
  );
}
