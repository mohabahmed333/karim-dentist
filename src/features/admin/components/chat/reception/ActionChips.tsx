"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "@/lib/i18n";
import type { ClinicChatAction } from "@/services/clinic_chat";
import { CHIP_PILL_CLASS, CHIP_RAIL_CLASS } from "./chipRail";
import {
  chatTransition,
  chipItemVariants,
  chipListVariants,
} from "../chatMotion";

type Props = {
  actions: ClinicChatAction[];
  disabled?: boolean;
  onPick: (action: ClinicChatAction) => void;
};

const LABEL_KEYS: Record<string, string> = {
  "start:book": "admin.chat.action.book",
  "start:today": "admin.chat.action.today",
  "start:pending": "admin.chat.action.pending",
  "start:noshow": "admin.chat.action.noshow",
  "start:note": "admin.chat.action.note",
  "book:new": "admin.chat.action.newPatient",
  "book:confirm": "admin.chat.action.confirmBook",
  "book:cancel": "admin.poll.cancel",
  "book:replace": "admin.chat.action.replaceReservation",
  "book:for-chat": "admin.chat.action.bookForChat",
  "pending:confirm": "admin.chat.action.confirm",
  "pending:cancel": "admin.chat.action.cancelBooking",
  "pending:reschedule": "admin.chat.action.reschedule",
  "note:confirm": "admin.chat.action.saveNote",
  "patient:note": "admin.chat.action.addNote",
  "patient:goto": "admin.chat.action.openWorkspace",
  noshow: "admin.chat.action.noshow",
};

export function ActionChips({ actions, disabled, onPick }: Props) {
  const t = useTranslations();
  const reduced = useReducedMotion();
  if (actions.length === 0) return null;

  return (
    <motion.div
      className={`mt-2.5 ${CHIP_RAIL_CLASS}`}
      variants={chipListVariants}
      initial="hidden"
      animate="show"
    >
      {actions.map((action) => {
        const key = LABEL_KEYS[action.id];
        const label = key ? t(key as Parameters<typeof t>[0]) : action.label;
        return (
          <motion.button
            key={`${action.id}-${action.label}-${action.payload?.id ?? ""}`}
            type="button"
            disabled={disabled}
            variants={chipItemVariants}
            transition={chatTransition(reduced, 0.22)}
            whileHover={reduced || disabled ? undefined : { scale: 1.03, y: -1 }}
            whileTap={reduced || disabled ? undefined : { scale: 0.96 }}
            onClick={() => onPick(action)}
            className={`${CHIP_PILL_CLASS} border border-[var(--admin-border)] bg-[var(--admin-canvas)] text-[var(--admin-text)] hover:border-[var(--admin-primary)] hover:text-[var(--admin-primary)]`}
          >
            {label}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
