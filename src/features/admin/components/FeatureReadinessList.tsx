"use client";

import { Checkbox } from "@/components/ui/checkbox";

export type FeatureCondition = {
  key: string;
  label: string;
  met: boolean | null;
  why: string;
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
  check: { label: "Check manually", className: "border-[#FCD34D] bg-[#FFFBEB] text-[#B45309]" },
};

/**
 * Every feature, and every reason it might not be working.
 *
 * The boxes are ticked by the server from live settings, keys and database
 * counts, so they are read-only: the way to tick one is to fix its cause.
 * A condition that cannot be checked automatically is left unticked and says so,
 * because an unverifiable box shown as ticked is a promise nobody made.
 */
export function FeatureReadinessList({ features }: { features: FeatureStatus[] }) {
  const blocked = features.filter((f) => f.state === "blocked").length;

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Why a feature may not work</h3>
        <p className="text-xs text-[var(--admin-muted)]">
          Each box is ticked automatically when its condition is met. They cannot be
          changed here — fix the cause, then reopen this tab.
          {blocked > 0 ? ` ${blocked} of ${features.length} features are not working yet.` : ""}
        </p>
      </div>

      <div className="space-y-2">
        {features.map((feature) => {
          const met = feature.conditions.filter((c) => c.met === true).length;
          const state = STATE[feature.state];
          return (
            <details
              key={feature.key}
              open={feature.state === "blocked"}
              className="group rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="block font-medium">{feature.title}</span>
                  <span className="block text-xs text-[var(--admin-muted)]">{feature.summary}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-xs tabular-nums text-[var(--admin-muted)]">
                    {met}/{feature.conditions.length}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${state.className}`}>
                    {state.label}
                  </span>
                </span>
              </summary>

              <ul className="space-y-2 border-t border-[var(--admin-border,#e5e7eb)] px-3 py-3">
                {feature.conditions.map((condition) => {
                  const id = `cond-${feature.key}-${condition.key}`;
                  return (
                    <li key={condition.key} className="flex gap-2.5">
                      <Checkbox
                        id={id}
                        checked={condition.met === true}
                        disabled
                        className="mt-0.5"
                        aria-describedby={`${id}-why`}
                      />
                      <div className="min-w-0 space-y-0.5">
                        <label htmlFor={id} className="block text-sm">
                          {condition.label}
                          {condition.met === null ? (
                            <span className="ml-2 rounded border border-[#FCD34D] bg-[#FFFBEB] px-1.5 py-0.5 text-[11px] text-[#B45309]">
                              check manually
                            </span>
                          ) : null}
                        </label>
                        {condition.met !== true ? (
                          <p id={`${id}-why`} className="text-xs leading-relaxed text-[var(--admin-muted)]">
                            {condition.why}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </div>
    </section>
  );
}
