import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";

const LABEL_MAP: Record<string, AdminMessageKey> = {
  Channel: "admin.frontDesk.label.channel",
  Status: "admin.frontDesk.label.status",
  "Clinic record": "admin.frontDesk.label.clinicRecord",
  Name: "admin.frontDesk.label.name",
  Phone: "admin.frontDesk.label.phone",
  "Patient key": "admin.frontDesk.label.patientKey",
  Visits: "admin.frontDesk.label.visits",
  "Next visit": "admin.frontDesk.label.nextVisit",
  Email: "admin.frontDesk.label.email",
  Services: "admin.frontDesk.label.services",
  "Last visit": "admin.frontDesk.label.lastVisit",
  "WhatsApp name": "admin.frontDesk.label.whatsappName",
};

const VALUE_MAP: Record<string, AdminMessageKey> = {
  "No matching patient": "admin.frontDesk.value.noPatient",
  "Matched by phone": "admin.frontDesk.value.matchedPhone",
  None: "admin.frontDesk.value.none",
};

export function translateFrontDeskLabel(
  label: string,
  t: (key: AdminMessageKey) => string,
): string {
  const key = LABEL_MAP[label];
  return key ? t(key) : label;
}

export function translateFrontDeskValue(
  value: string,
  t: (key: AdminMessageKey) => string,
): string {
  const key = VALUE_MAP[value];
  return key ? t(key) : value;
}
