import { fdiSchema } from "./schemas";

type NavAction = { kind: string; payload: Record<string, unknown> };

/**
 * A model-supplied href is only honoured when it stays inside the admin.
 * Anything absolute, protocol-relative or walking up with `..` is ignored and
 * the link is rebuilt from ids instead.
 */
function internalAdminHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/admin/")) return null;
  if (value.includes("..") || value.includes("\\")) return null;
  return value;
}

/**
 * Where a navigation action should take staff, or null if it cannot say.
 *
 * Shared by the adapters (preview/execute) and the chat client, which used to
 * read `payload.href` directly — so a model that omitted it navigated nowhere.
 */
export function hrefForNavAction(
  action: NavAction,
  activePatientKey?: string | null,
): string | null {
  const payload = action.payload;
  const patientKey = String(payload.patientKey ?? "") || activePatientKey || "";

  if (action.kind === "navigate.open_patient") {
    const explicit = internalAdminHref(payload.href);
    if (explicit) return explicit;
    return patientKey ? `/admin/patients/${encodeURIComponent(patientKey)}` : null;
  }

  if (action.kind === "navigate.focus_tooth") {
    const fdi = fdiSchema.safeParse(String(payload.fdi ?? payload.tooth_fdi ?? ""));
    if (!fdi.success) return null;
    const explicit = internalAdminHref(payload.href);
    if (explicit) return explicit;
    return patientKey
      ? `/admin/patients/${encodeURIComponent(patientKey)}/workspace?tooth=${fdi.data}`
      : null;
  }

  return null;
}
