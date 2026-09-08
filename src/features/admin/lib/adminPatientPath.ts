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
