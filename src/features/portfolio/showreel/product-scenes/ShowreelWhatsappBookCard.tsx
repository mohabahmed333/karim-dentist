"use client";

import { motion } from "framer-motion";
import { chatTransition, messageVariants } from "@/features/admin/components/chat/chatMotion";
import {
  BOOKING_SLOT_FIXTURES,
  RESERVATION_FIXTURES,
} from "./fixtures/reservationFixtures";

type Props = {
  onConfirm: () => void;
  onCancel: () => void;
};

const SARA = RESERVATION_FIXTURES.find((r) => r.id === "res-sara")!;
const SLOT = BOOKING_SLOT_FIXTURES[0]!;

/** Offline booking card for WhatsApp showreel — no Kapso/reservation writes. */
export function ShowreelWhatsappBookCard({ onConfirm, onCancel }: Props) {
  return (
    <motion.div
      data-showreel-action="whatsapp-book-card"
      className="mx-3 mb-2 space-y-2 rounded-2xl border border-[#E8EAED] bg-[#F8F9FB] p-3"
      variants={messageVariants}
      initial="hidden"
      animate="show"
      transition={chatTransition(false)}
    >
      <p className="text-[13px] font-semibold text-[#111111]">New reservation</p>
      <p className="text-[11px] text-[#70758A]">
        Prefill from WhatsApp · review before saving
      </p>
      <dl className="space-y-1.5 rounded-xl border border-[#E8EAED] bg-white px-3 py-2.5 text-[12px]">
        <div className="flex justify-between gap-2">
          <dt className="text-[#70758A]">Patient</dt>
          <dd className="font-medium text-[#111111]">{SARA.patientName}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[#70758A]">Service</dt>
          <dd className="font-medium text-[#111111]">{SARA.serviceLabel}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[#70758A]">When</dt>
          <dd className="font-medium text-[#111111]">{SLOT.label}</dd>
        </div>
      </dl>
      <div className="flex gap-2">
        <button
          type="button"
          data-showreel-action="whatsapp-book-confirm"
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-[var(--admin-primary)] px-3 py-2 text-[12px] font-semibold text-white"
        >
          Confirm reservation
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[#E8EAED] bg-white px-3 py-2 text-[12px] font-medium text-[#70758A]"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

export const SHOWREEL_BOOK_CONFIRM_TEXT = [
  "Your appointment is confirmed ✅",
  `• Service: ${SARA.serviceLabel}`,
  `• When: ${SLOT.label}`,
  "",
  "See you at The Dental Lounge.",
].join("\n");
