"use client";

import { useLocale } from "@/lib/i18n";
import type { DayScheduleBlock } from "@/features/admin/lib/dayScheduleModel";
import {
  DAY_SCHEDULE_END_HOUR,
  DAY_SCHEDULE_PX_PER_HOUR,
  DAY_SCHEDULE_START_HOUR,
  dayScheduleHours,
  statusBlockStyle,
} from "@/features/admin/lib/dayScheduleModel";

type Props = {
  blocks: DayScheduleBlock[];
  laneCount: number;
  empty: boolean;
  emptyLabel?: string;
  onPatientSelect?: (reservation: DayScheduleBlock["reservation"]) => void;
};

export function DayScheduleGrid({
  blocks,
  laneCount,
  empty,
  emptyLabel = "No appointments this day",
  onPatientSelect,
}: Props) {
  const { locale } = useLocale();
  const hours = dayScheduleHours();
  const hourLocale = locale === "ar" ? "ar" : undefined;
  const gridHeight =
    (DAY_SCHEDULE_END_HOUR - DAY_SCHEDULE_START_HOUR) * DAY_SCHEDULE_PX_PER_HOUR;

  return (
    <div className="overflow-x-auto px-2 pb-3">
      <div className="flex min-w-[28rem]">
        <div className="w-14 shrink-0 select-none pt-1">
          {hours.map((hour) => (
            <div
              key={hour}
              className="pe-2 text-end text-[11px] text-[var(--admin-muted)]"
              style={{ height: DAY_SCHEDULE_PX_PER_HOUR }}
            >
              {(() => {
                const d = new Date();
                d.setHours(hour, 0, 0, 0);
                return d.toLocaleTimeString(hourLocale, {
                  hour: "2-digit",
                  minute: "2-digit",
                });
              })()}
            </div>
          ))}
        </div>
        <div
          className="relative min-w-0 flex-1 rounded-md border border-[var(--admin-border)] bg-[var(--admin-canvas)]"
          style={{ height: gridHeight }}
        >
          {hours.slice(0, -1).map((hour) => (
            <div
              key={`line-${hour}`}
              className="pointer-events-none absolute end-0 start-0 border-t border-[var(--admin-border)]"
              style={{
                top:
                  (hour - DAY_SCHEDULE_START_HOUR) * DAY_SCHEDULE_PX_PER_HOUR,
              }}
            />
          ))}
          {empty ? (
            <p className="absolute inset-0 flex items-center justify-center text-[13px] text-[var(--admin-muted)]">
              {emptyLabel}
            </p>
          ) : (
            blocks.map(({ reservation, lane, topPx, heightPx }) => {
              const style = statusBlockStyle(reservation.status);
              const gapRem = 0.4;
              const sidePadRem = 0.35;
              const gapsTotal = (laneCount - 1) * gapRem;
              const track = `100% - ${sidePadRem * 2}rem - ${gapsTotal}rem`;
              return (
                <button
                  key={reservation.id}
                  type="button"
                  onClick={() => onPatientSelect?.(reservation)}
                  title={`${reservation.patient_name} · ${reservation.service_label}`}
                  className="absolute overflow-hidden rounded-lg border px-2 py-1.5 text-start transition-opacity hover:opacity-90"
                  style={{
                    top: topPx,
                    height: Math.max(heightPx - 2, 28),
                    insetInlineStart: `calc(${sidePadRem}rem + ${lane} * ((${track}) / ${laneCount} + ${gapRem}rem))`,
                    width: `calc((${track}) / ${laneCount})`,
                    background: style.background,
                    borderColor: style.border,
                    color: style.color,
                  }}
                >
                  <p className="truncate text-[12px] font-semibold leading-tight">
                    {reservation.service_label}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--admin-muted)]">
                    {reservation.patient_name}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
