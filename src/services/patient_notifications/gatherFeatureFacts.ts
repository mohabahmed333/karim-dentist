/**
 * Collect the facts behind the per-feature checklist in Settings.
 *
 * Fails soft everywhere: a fact that cannot be established becomes `null`
 * (shown as "check manually") or `false`, never a guess of `true`. Only booleans
 * and counts leave this function — never a secret's value.
 */

import type { createServiceClient } from "@/lib/supabase/service";
import { hasAnyAiKey, resolveVisionChain } from "@/services/ai_chat";
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
  const [templates, scheduled, settings, ai, knowledge, site, consent, deposits] = await Promise.all([
    known.approvedTemplateNames !== undefined
      ? Promise.resolve(known.approvedTemplateNames)
      : approvedTemplateNames(),
    known.cronScheduled !== undefined ? Promise.resolve(known.cronScheduled) : cronScheduled(db),
    db
      .from("patient_notification_settings")
      .select("mode,recall_enabled,reminder_lead_minutes,review_url")
      .limit(1)
      .maybeSingle(),
    loadAiSettings(db).catch(() => null),
    db
      .from("clinic_knowledge")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .is("deleted_at", null),
    db.from("site_settings").select("contact_map_url").limit(1).maybeSingle(),
    db
      .from("patient_marketing_consent")
      .select("phone_suffix", { count: "exact", head: true })
      .is("withdrawn_at", null),
    db
      .from("deposit_settings")
      .select("enabled,auto_confirm,amount_egp,instapay_handle,wallet_number,recipient_names")
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    env: {
      cronSecret: present(process.env.CRON_SECRET),
      kapso: hasKapsoConfig(),
      kapsoWebhookSecret: present(process.env.KAPSO_WEBHOOK_SECRET),
      serviceRole: present(process.env.SUPABASE_SERVICE_ROLE_KEY),
      // Any provider in the chain will do — the assistant only needs one.
      aiKey: hasAnyAiKey(),
      // Reading a receipt is a different question: most of the chain is blind.
      visionKey: resolveVisionChain().length > 0,
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
    marketingConsentCount: consent.error ? null : (consent.count ?? 0),
    reviewUrl: present(settings.data?.review_url ?? undefined),
    depositTablesPresent: !deposits.error,
    deposits: deposits.data
      ? {
          enabled: deposits.data.enabled,
          autoConfirm: deposits.data.auto_confirm,
          amountEgp: Number(deposits.data.amount_egp),
          hasDestination:
            present(deposits.data.instapay_handle) || present(deposits.data.wallet_number),
          recipientNames: (deposits.data.recipient_names ?? []).filter((n) => n.trim()).length,
        }
      : null,
  };
}
