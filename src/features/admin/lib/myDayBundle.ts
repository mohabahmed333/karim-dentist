/**
 * The loaded bundle, but only while it belongs to the patient on screen.
 *
 * My Day keeps the patient bundle in state, so it lags the selected patient by
 * one fetch every time the chair changes. Anything rendered from the lagging
 * bundle is the *previous* patient's record — visible through the translucent
 * loading overlay, and sticky in any child that seeds state from its props on
 * mount. Returning null instead is what keeps a tab blank rather than wrong.
 */
export function bundleForPatient<T extends { patientKey: string }>(
  bundle: T | null | undefined,
  patientKey: string | null | undefined,
): T | null {
  if (!bundle || !patientKey) return null;
  return bundle.patientKey === patientKey ? bundle : null;
}
