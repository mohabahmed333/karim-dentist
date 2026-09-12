import type { AnyMessageKey } from "@/lib/i18n";

type TFn = (key: AnyMessageKey) => string;

/**
 * Example free-text questions shown under the welcome message, so staff see
 * Clinic Assist can answer more than the chip flows — this is the tool loop
 * (search_patients, list_reservations, …) actually earning its keep.
 */
export function starterPrompts(pathname: string | null, t: TFn): string[] {
  if (pathname?.startsWith("/admin/patients/")) {
    return [
      t("admin.chat.starter.patientHistory"),
      t("admin.chat.starter.patientFollowup"),
    ];
  }
  return [
    t("admin.chat.starter.today"),
    t("admin.chat.starter.pending"),
    t("admin.chat.starter.policy"),
  ];
}
