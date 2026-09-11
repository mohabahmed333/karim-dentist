import { parseAsStringLiteral } from "nuqs/server";

/**
 * The Settings tabs, as they appear in the URL: /admin/settings?tab=clinic-hours.
 *
 * Readable slugs rather than internal keys, because the URL is what people
 * bookmark and paste to each other. The order is the order of the tab bar.
 */
export const SETTINGS_TABS = [
  "dashboard",
  "clinic-hours",
  "site",
  "clinic-prices",
  "whatsapp-ai",
  "patient-notifications",
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number];

export const DEFAULT_SETTINGS_TAB: SettingsTab = "dashboard";

/**
 * Reads and writes ?tab=.
 *
 * - An unknown or missing value opens the dashboard, so a stale bookmark still
 *   lands somewhere sensible.
 * - Switching tabs replaces the history entry, so Back leaves Settings rather
 *   than walking back through every tab that was clicked.
 * - No scroll jump, and no server round-trip: the tabs are client-side.
 * - Choosing the dashboard removes the param, keeping /admin/settings clean.
 *   That is nuqs' default already; it is set here so a change to the shared
 *   default cannot silently alter this page.
 */
export const settingsTabParser = parseAsStringLiteral(SETTINGS_TABS)
  .withOptions({ history: "replace", scroll: false, shallow: true, clearOnDefault: true })
  .withDefault(DEFAULT_SETTINGS_TAB);
