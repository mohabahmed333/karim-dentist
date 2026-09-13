/**
 * The names Meta has approved for this WhatsApp number, or null.
 *
 * Null means "we could not ask" — no API key, no business account id, or Meta
 * did not answer — which the templates page shows as unknown rather than as
 * missing. Reporting a template missing because our own credentials are absent
 * would send staff to Meta to re-create templates that are already there.
 */

import { createKapsoClient, getKapsoConfig } from "@/lib/kapso/client";

export async function listApprovedTemplateNames(): Promise<string[] | null> {
  try {
    const { businessAccountId } = getKapsoConfig();
    if (!businessAccountId) return null;

    const listed = await createKapsoClient().templates.list({
      businessAccountId,
      status: "APPROVED",
      limit: 100,
    });

    const raw = (listed as { data?: unknown[] }).data ?? [];
    return raw
      .map((item) => (item as { name?: string }).name ?? "")
      .filter((name) => name !== "");
  } catch (error) {
    console.error("[templates] could not list approved templates", error);
    return null;
  }
}
