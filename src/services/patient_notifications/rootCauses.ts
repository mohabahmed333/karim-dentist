/**
 * Collapse every feature's conditions into the few things that actually need fixing.
 *
 * With nothing set up, thirteen features report about ninety unmet conditions —
 * but the same handful of causes repeat across them: the database has not been
 * updated, the switch is not on Send, the templates are not approved. Listing
 * each cause once, with the features it blocks, turns a long checklist into a
 * short to-do list.
 */

import { FIX, NO_TEMPLATE_LABEL } from "./featureConditions";

export type CauseInput = {
  title: string;
  conditions: { key: string; label: string; met: boolean | null; why: string; fix: string }[];
};

export type RootCause = {
  key: string;
  label: string;
  why: string;
  /** What to do about it. */
  fix: string;
  /** false: something is wrong. null: it cannot be checked automatically. */
  met: false | null;
  features: string[];
};

const MISSING_TEMPLATES: Pick<RootCause, "key" | "label" | "why" | "fix"> = {
  key: "templates_missing",
  label: "No WhatsApp template yet",
  why: "These messages are queued but never sent. Nothing has been submitted to Meta for them yet — open each feature for the exact text to submit.",
  fix: FIX.noTemplate,
};

export function rootCauses(features: CauseInput[]): RootCause[] {
  const byKey = new Map<string, RootCause>();

  for (const feature of features) {
    for (const condition of feature.conditions) {
      if (condition.met === true) continue;

      // Six message types without a template are one fix, not six problems.
      const merged = condition.met === false && condition.label === NO_TEMPLATE_LABEL;
      const key = merged ? MISSING_TEMPLATES.key : condition.key;

      const existing = byKey.get(key);
      if (existing) {
        if (!existing.features.includes(feature.title)) existing.features.push(feature.title);
        continue;
      }
      byKey.set(key, {
        ...(merged
          ? MISSING_TEMPLATES
          : { key, label: condition.label, why: condition.why, fix: condition.fix }),
        met: condition.met === false ? false : null,
        features: [feature.title],
      });
    }
  }

  return [...byKey.values()].sort((a, b) => {
    if (a.met !== b.met) return a.met === false ? -1 : 1;
    if (a.features.length !== b.features.length) return b.features.length - a.features.length;
    return a.label.localeCompare(b.label);
  });
}
