"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  /** What the person should do. */
  text: string;
  label?: string;
};

/**
 * A small "?" that explains what to do about the item beside it.
 *
 * Opens on hover and on keyboard focus, and the full text is also in the
 * trigger's accessible name, so it is not hover-only. Must sit beside a row's
 * button rather than inside it: a button cannot contain another button.
 */
export function HelpTip({ text, label = "What to do" }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label={`${label}: ${text}`}
        className="inline-flex size-5 shrink-0 cursor-help items-center justify-center rounded-full border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)] text-[11px] font-semibold leading-none text-[var(--admin-muted)] transition-colors hover:border-[var(--admin-text,#1a1a1a)] hover:text-[var(--admin-text,#1a1a1a)] focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        ?
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px] text-left text-xs font-normal leading-snug">
        <span className="mb-0.5 block font-semibold">{label}</span>
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
