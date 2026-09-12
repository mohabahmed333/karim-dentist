import type { ClinicChatMessageMeta } from "./types";

/**
 * Merge a patch into a message's existing meta, pure so it's testable
 * without a database. A field patched to `undefined` is removed rather than
 * stored as a literal `undefined` — how `setFeedback` clears a reaction.
 */
export function mergeMeta(
  existing: ClinicChatMessageMeta | null | undefined,
  patch: Partial<ClinicChatMessageMeta>,
): ClinicChatMessageMeta {
  const merged: ClinicChatMessageMeta = { ...(existing ?? {}) };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete merged[key];
    else merged[key] = value;
  }
  return merged;
}
