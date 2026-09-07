"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "@/lib/i18n";
import { CHIP_PILL_CLASS, CHIP_RAIL_CLASS } from "./chipRail";
import { getStartActions } from "./flowTypes";
import {
  chatTransition,
  chipItemVariants,
  chipListVariants,
} from "../chatMotion";

type Props = {
  disabled?: boolean;
  onPick: (id: string) => void;
};

export function QuickActionBar({ disabled, onPick }: Props) {
  const t = useTranslations();
  const reduced = useReducedMotion();
  const actions = getStartActions(t);

  return (
    <div className="min-w-0 border-b border-[var(--admin-border)] px-3 py-2">
      <motion.div
        className={CHIP_RAIL_CLASS}
        role="toolbar"
        aria-label={t("admin.chat.actions")}
        variants={chipListVariants}
        initial="hidden"
        animate="show"
      >
        {actions.map((action) => (
          <motion.button
            key={action.id}
            type="button"
            disabled={disabled}
            variants={chipItemVariants}
            transition={chatTransition(reduced, 0.22)}
            whileHover={
              reduced || disabled ? undefined : { scale: 1.03, y: -1 }
            }
            whileTap={reduced || disabled ? undefined : { scale: 0.96 }}
            onClick={() => onPick(action.id)}
            className={`${CHIP_PILL_CLASS} bg-[var(--admin-hover)] text-[var(--admin-text)] hover:bg-[var(--admin-active)] hover:text-[var(--admin-primary)]`}
          >
            {action.label}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
