/**
 * Collect the facts behind the per-feature checklist in Settings.
 *
 * Fails soft everywhere: a fact that cannot be established becomes `null`
 * (shown as "check manually") or `false`, never a guess of `true`. Only booleans
 * and counts leave this function — never a secret's value.
 */

import type { createServiceClient } from "@/lib/supabase/service";
import { hasAnyAiKey } from "@/services/ai_chat";
import { loadAiSettings } from "@/services/whatsapp_ai/store";
import type { AiMode, FeatureFacts } from "./featureConditions";
import { approvedTemplateNames, cronScheduled, hasKapsoConfig } from "./gatherReadiness";

type ServiceClient = ReturnType<typeof createServiceClient>;

const present = (value: string | undefined) => Boolean(value?.trim());

export async function gatherFeatureFacts(
  db: ServiceClient,
  // Reuse what the readiness check already fetched, so opening Settings asks
  // Meta for the template list once rather than twice.
  known: { approvedTemplateNames?: string[] | null; cronScheduled?: boolean | null } = {},
): Promise<FeatureFacts> {
  const [templates, scheduled, settings, ai, knowledge, site] = await Promise.all([
    known.approvedTemplateNames !== undefined
      ? Promise.resolve(known.approvedTemplateNames)
      : approvedTemplateNames(),
    known.cronScheduled !== undefined ? Promise.resolve(known.cronScheduled) : cronScheduled(db),
    db
      .from("patient_notification_settings")
      .select("mode,recall_enabled,reminder_lead_minutes")
      .limit(1)
      .maybeSingle(),
    loadAiSettings(db).catch(() => null),
    db
      .from("clinic_knowledge")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .is("deleted_at", null),
    db.from("site_settings").select("contact_map_url").limit(1).maybeSingle(),
  ]);

  return {
    env: {
      cronSecret: present(process.env.CRON_SECRET),
      kapso: hasKapsoConfig(),
      kapsoWebhookSecret: present(process.env.KAPSO_WEBHOOK_SECRET),
      serviceRole: present(process.env.SUPABASE_SERVICE_ROLE_KEY),
      // Any provider in the chain will do — the assistant only needs one.
      aiKey: hasAnyAiKey(),
    },
    // Any error reading the settings table is treated as "not migrated": a
    // conservative false beats telling staff a feature works when it cannot.
    notificationTablesPresent: !settings.error,
    notifications: settings.data
      ? {
          mode: settings.data.mode,
          recallEnabled: settings.data.recall_enabled,
          reminderLeadMinutes: settings.data.reminder_lead_minutes,
        }
      : null,
    cronScheduled: scheduled,
    approvedTemplateNames: templates,
    ai: ai ? { mode: ai.mode as AiMode, allowBookingWrites: ai.allow_booking_writes } : null,
    publishedKnowledge: knowledge.error ? null : (knowledge.count ?? 0),
    clinicMapUrl: present(site.data?.contact_map_url ?? undefined),
  };
}
