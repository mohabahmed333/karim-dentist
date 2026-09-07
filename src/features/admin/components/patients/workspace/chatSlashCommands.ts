import type { TreatmentAiPoll } from "@/services/ai_groq";
import { formatAppointmentLabel } from "@/services/cdt";
import { listOpenAppointmentSlots } from "@/services/clinic_schedule";
import type { AnyMessageKey } from "@/lib/i18n";
import {
  matchSlashCommands as matchShared,
  type ChatSlashCommand,
} from "@/features/admin/components/chat";

export type { ChatSlashCommand };

type TFn = (key: AnyMessageKey) => string;

export function getChatSlashCommands(t: TFn): ChatSlashCommand[] {
  return [
    {
      id: "reschedule",
      label: "/reschedule",
      hint: t("admin.chat.hint.reschedule"),
      insert: "/reschedule",
    },
    {
      id: "book",
      label: "/book",
      hint: t("admin.chat.hint.bookTreatment"),
      insert: "/book",
    },
  ];
}

export function matchSlashCommands(
  input: string,
  commands?: ChatSlashCommand[],
): ChatSlashCommand[] {
  // callers should pass localized commands; empty fallback avoids EN-only hints
  return matchShared(input, commands ?? []);
}

/** Build a WhatsApp-style poll of upcoming open clinic slots. */
export async function buildRescheduleSlotPoll(
  currentStartsAt?: string | null,
  t?: TFn,
): Promise<TreatmentAiPoll> {
  const open = await listOpenAppointmentSlots({
    fromIso: new Date().toISOString(),
  });
  const slots = open.slice(0, 6);
  const options = slots.map((slot, i) => ({
    id: `slot-${i}`,
    label: formatAppointmentLabel(slot.starts_at),
    value: slot.starts_at,
  }));
  const otherLabel = t
    ? t("admin.poll.otherSlot")
    : "Other date / time…";
  options.push({
    id: "slot-custom",
    label: otherLabel,
    value: "custom",
  });

  const current = currentStartsAt
    ? t
      ? t("admin.poll.currentSlot").replace(
          "{label}",
          formatAppointmentLabel(currentStartsAt),
        )
      : ` Current: ${formatAppointmentLabel(currentStartsAt)}.`
    : "";

  const question =
    slots.length > 0
      ? t
        ? t("admin.poll.chooseSlot").replace("{current}", current)
        : `Choose a new appointment slot.${current}`
      : t
        ? t("admin.poll.noSlots").replace("{current}", current)
        : `No open clinic slots right now.${current} Pick a custom time.`;

  return {
    id: `reschedule-${Date.now()}`,
    kind: "slot",
    question,
    options: options.slice(0, 8),
  };
}
