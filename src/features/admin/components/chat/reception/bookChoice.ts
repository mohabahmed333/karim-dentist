import type { ClinicChatAction } from "@/services/clinic_chat";
import type { AnyMessageKey } from "@/lib/i18n";
import type { ActivePatient } from "./flowTypes";

type TFn = (key: AnyMessageKey) => string;

export function shouldOfferBookChoice(
  patient: ActivePatient | null | undefined,
): boolean {
  return Boolean(patient?.patientKey);
}

export function bookChoiceActions(t: TFn): ClinicChatAction[] {
  return [
    {
      id: "book:replace",
      label: t("admin.chat.action.replaceReservation"),
    },
    {
      id: "book:for-chat",
      label: t("admin.chat.action.bookForChat"),
    },
  ];
}
