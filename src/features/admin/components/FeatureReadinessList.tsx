"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { HelpTip } from "./HelpTip";
import { TemplateProposalCard, type TemplateProposal } from "./TemplateProposalCard";

export type FeatureCondition = {
  key: string;
  label: string;
  met: boolean | null;
  why: string;
  /** What to do to make it true. */
  fix: string;
  /** For a message with no template yet: the text to submit to Meta. */
  proposal?: TemplateProposal;
};

export type FeatureStatus = {
  key: string;
  title: string;
  summary: string;
  state: "working" | "blocked" | "check";
  conditions: FeatureCondition[];
};

const STATE: Record<FeatureStatus["state"], { label: string; className: string }> = {
  working: { label: "Working", className: "border-[#86EFAC] bg-[#F0FDF4] text-[#15803D]" },
  blocked: { label: "Not working", className: "border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]" },
  check: { label: "Check", className: "border-[#FCD34D] bg-[#FFFBEB] text-[#B45309]" },
};

/** What still has to be done for one feature, for its "?" tooltip. */
function featureFix(feature: FeatureStatus): string {
  const todo = feature.conditions.filter((c) => c.met !== true);
  if (todo.length === 0) return "Nothing to do — everything this feature needs is in place.";
  const shown = todo.slice(0, 4).map((c, i) => `${i + 1}. ${c.fix}`);
  const more = todo.length > 4 ? ` +${todo.length - 4} more — open the row for all of them.` : "";
  return `${shown.join(" ")}${more}`;
}

/**
 * Every feature on one line, opened one at a time.
 *
 * Nothing starts expanded: with a fresh setup almost every feature is blocked,
 * and opening each by default is what made this tab a long scroll. The boxes are
 * ticked by the server and read-only — the way to tick one is to fix its cause.
 */
export function FeatureReadinessList({ features }: { features: FeatureStatus[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const working = features.filter((f) => f.state === "working").length;

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">Features</h3>
        <span className="text-xs tabular-nums text-[var(--admin-muted)]">
          {working} of {features.length} working
        </span>
      </div>

      <ul className="overflow-hidden rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)]">
        {features.map((feature) => {
          const open = openKey === feature.key;
          const met = feature.conditions.filter((c) => c.met === true).length;
          const state = STATE[feature.state];
          return (
            <li key={feature.key} className="border-b border-[var(--admin-border,#e5e7eb)] last:border-b-0">
              <div className="flex items-center hover:bg-[var(--admin-canvas,#f7f7f8)]">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenKey(open ? null : feature.key)}
                className="flex min-w-0 flex-1 items-center gap-3 py-2 pl-3 pr-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
              >
                <span className="min-w-0 flex-1 truncate">{feature.title}</span>
                <span className="shrink-0 text-xs tabular-nums text-[var(--admin-muted)]">
                  {met}/{feature.conditions.length}
                </span>
                <span className={`min-w-[88px] shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-center text-xs ${state.className}`}>
                  {state.label}
                </span>
                <ChevronRight
                  aria-hidden
                  className={`size-4 shrink-0 text-[var(--admin-muted)] transition-transform ${open ? "rotate-90" : ""}`}
                />
              </button>
              <span className="pr-3">
                <HelpTip label={`To make “${feature.title}” work`} text={featureFix(feature)} />
              </span>
              </div>

              {open ? (
                <div className="space-y-2 border-t border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-canvas,#f7f7f8)] px-3 py-2.5">
                  <p className="text-xs text-[var(--admin-muted)]">{feature.summary}</p>
                  <ul className="space-y-1.5">
                    {feature.conditions.map((condition) => {
                      const id = `cond-${feature.key}-${condition.key}`;
                      return (
                        <li key={condition.key} className="flex gap-2.5">
                          <Checkbox id={id} checked={condition.met === true} disabled className="mt-0.5" />
                          <div className="min-w-0">
                            <span className="flex items-start gap-1.5">
                              <label htmlFor={id} className="text-sm">
                                {condition.label}
                                {condition.met === null ? (
                                  <span className="ml-2 text-[11px] text-[#B45309]">check by hand</span>
                                ) : null}
                              </label>
                              {condition.met !== true ? <HelpTip text={condition.fix} /> : null}
                            </span>
                            {condition.met !== true ? (
                              <p className="text-xs leading-relaxed text-[var(--admin-muted)]">{condition.why}</p>
                            ) : null}
                            {condition.proposal ? <TemplateProposalCard proposal={condition.proposal} /> : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
