import type { Tables } from "@/lib/supabase/database.types";

export type PatientNotificationSettings = Tables<"patient_notification_settings">;
export type PatientNotification = Tables<"patient_notifications">;

/** The feature flag itself. `off` is the shipped default. */
export type NotificationMode = "off" | "dry_run" | "send";
