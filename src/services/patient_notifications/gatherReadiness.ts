/**
 * Collect the facts evaluateReadiness() reasons over.
 *
 * Kept apart from the rules so the rules stay testable without a WhatsApp
 * account, a live cron or a database. Everything here fails soft: a fact we
 * cannot establish is reported as unknown, never guessed at.
 */

import { createKapsoClient, getKapsoConfig } from "@/lib/kapso/client";
import type { createServiceClient } from "@/lib/supabase/service";
import type { ReadinessFacts } from "./readiness";

type ServiceClient = ReturnType<typeof createServiceClient>;

export async function approvedTemplateNames(): Promise<string[] | null> {
  try {
    const { businessAccountId } = getKapsoConfig();
    if (!businessAccountId) return null;
    const listed = await createKapsoClient().templates.list({
      businessAccountId,
      status: "APPROVED",
      limit: 100,
    });
    const rows = (listed as { data?: { name?: string }[] }).data ?? [];
    return rows.map((t) => t.name ?? "").filter(Boolean);
  } catch {
    // Unreachable Meta, missing WABA id, bad key — all "we cannot tell".
    return null;
  }
}

export async function cronScheduled(db: ServiceClient): Promise<boolean | null> {
  try {
    const { data, error } = await db.rpc("patient_notifications_cron_scheduled");
    if (error) return null;
    return typeof data === "boolean" ? data : null;
  } catch {
    return null;
  }
}

/** Whether the WhatsApp transport is configured. Never throws. */
export function hasKapsoConfig(): boolean {
  try {
    getKapsoConfig();
    return true;
  } catch {
    return false;
  }
}

export async function gatherReadinessFacts(
  db: ServiceClient,
): Promise<ReadinessFacts> {
  let hasKapso = true;
  try {
    getKapsoConfig();
  } catch {
    hasKapso = false;
  }

  const [templates, scheduled, settings] = await Promise.all([
    approvedTemplateNames(),
    cronScheduled(db),
    db.from("patient_notification_settings").select("id").limit(1).maybeSingle(),
  ]);

  return {
    // Only ever booleans leave this function — never a secret's value.
    hasCronSecret: Boolean(process.env.CRON_SECRET?.trim()),
    hasKapso,
    hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    approvedTemplateNames: templates,
    cronScheduled: scheduled,
    settingsRowPresent: Boolean(settings.data),
  };
}
