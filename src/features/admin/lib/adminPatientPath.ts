const PATIENT_ROUTE =
  /^\/admin\/patients\/([^/]+)(?:\/workspace)?\/?$/;

/** Decode patient key from an admin patient profile or workspace URL. */
export function patientKeyFromAdminPath(pathname: string): string | null {
  const match = PATIENT_ROUTE.exec(pathname);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

export function canAddClinicalNote(pathname: string): boolean {
  return patientKeyFromAdminPath(pathname) !== null;
}

/**
 * Full WhatsApp page and patient clinical UI already have chat composers —
 * hide the floating FAB so it does not cover send.
 */
export function shouldHideAdminChatBubbles(pathname: string): boolean {
  if (pathname.startsWith("/admin/support")) return true;
  return patientKeyFromAdminPath(pathname) !== null;
}
