"use client";

import {
  isInRange,
  isRangeEdge,
  monthMatrix,
  sameDay,
  WEEKDAY_MESSAGE_KEYS,
  type DateRange,
} from "@/features/admin/lib/dateRangeModel";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";

type Props = {
  view: Date;
  draft: DateRange;
  onPickDay: (day: Date) => void;
};

export function DateRangeCalendarGrid({ view, draft, onPickDay }: Props) {
  const t = useTranslations();

  return (
    <>
      <div className="mb-1 grid grid-cols-7">
        {WEEKDAY_MESSAGE_KEYS.map((key, i) => (
          <span
            key={`${key}-${i}`}
            className="py-1 text-center text-[10px] font-medium text-[var(--admin-muted,#6b6f76)]"
          >
            {t(key as AdminMessageKey)}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthMatrix(view)
          .flat()
          .map((day) => {
            const inMonth = day.getMonth() === view.getMonth();
            const inSel = isInRange(day, draft);
            const edge = isRangeEdge(day, draft);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onPickDay(day)}
                className={cn(
                  "relative h-9 text-[12px] font-medium",
                  edge &&
                    "z-[1] rounded-lg bg-[var(--admin-secondary,#3b82f6)] text-white",
                  inSel &&
                    !edge &&
                    "bg-[color-mix(in_srgb,var(--admin-secondary,#3b82f6)_18%,white)] text-[var(--admin-text,#1a1a1a)]",
                  !inSel &&
                    inMonth &&
                    "text-[var(--admin-text,#1a1a1a)] hover:bg-[var(--admin-hover,#eeeff1)]",
                  !inMonth && "text-[var(--admin-muted,#6b6f76)] opacity-50",
                  inSel &&
                    !edge &&
                    !sameDay(day, draft.start) &&
                    "rounded-none",
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
      </div>
    </>
  );
}
