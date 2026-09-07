import type {
  Tables,
  TablesInsert,
  Json,
} from "@/lib/supabase/database.types";

export type ClinicChatThread = Tables<"clinic_chat_threads">;
export type ClinicChatMessage = Tables<"clinic_chat_messages">;
export type ClinicChatMessageInsert = TablesInsert<"clinic_chat_messages">;

export type ClinicChatAction = {
  id: string;
  label: string;
  payload?: Record<string, string>;
};

export type ClinicChatActivePatient = {
  patientKey: string;
  name: string;
  phone: string;
  href?: string;
  lastReservationId?: string;
  noteCount?: number;
};

export type ClinicChatThreadContext = {
  activePatient?: ClinicChatActivePatient;
};

export type ClinicChatMessageMeta = {
  actions?: ClinicChatAction[];
  flow?: string;
  activePatient?: ClinicChatActivePatient;
  proposalId?: string;
  proposalSummary?: string;
  proposalDiffs?: Json;
  proposedActions?: Json;
  [key: string]: Json | undefined;
};

export const HOME_THREAD_KIND = "home" as const;
export const SESSION_THREAD_KIND = "session" as const;
export const WELCOME_CONTENT =
  "I’m Clinic Assist. I can update the website, chart teeth, add clinical notes, and run front desk. Tap a chip or type — writes need your Confirm.";

export const WELCOME_ACTIONS = [
  { id: "start:website", label: "Website" },
  { id: "start:chart", label: "Chart" },
  { id: "start:clinical", label: "Clinical" },
  { id: "start:book", label: "Book" },
  { id: "start:today", label: "Today" },
  { id: "start:pending", label: "Pending" },
  { id: "start:patient", label: "Find patient" },
  { id: "start:noshow", label: "No-show" },
  { id: "start:note", label: "Note" },
] as const;
