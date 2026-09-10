"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { useLocale } from "@/lib/i18n";
import type { DayScheduleBlock } from "@/features/admin/lib/dayScheduleModel";
import {
  DAY_SCHEDULE_END_HOUR,
  DAY_SCHEDULE_PX_PER_HOUR,
  DAY_SCHEDULE_START_HOUR,
  dayScheduleHours,
  statusBlockStyle,
} from "@/features/admin/lib/dayScheduleModel";
import {
  dayScheduleCardContainerVariants,
  dayScheduleCardVariants,
} from "@/features/admin/lib/dayScheduleMotion";
import { ReservationServiceLabel } from "@/features/admin/components/ReservationServiceLabel";
import type { Service } from "@/services/services/types";

type Props = {
  blocks: DayScheduleBlock[];
  laneCount: number;
  empty: boolean;
  emptyLabel?: string;
  services?: Service[];
  onPatientSelect?: (reservation: DayScheduleBlock["reservation"]) => void;
};

export function DayScheduleGrid({
  blocks,
  laneCount,
  empty,
  emptyLabel = "No appointments this day",
  services = [],
  onPatientSelect,
}: Props) {
  const { locale } = useLocale();
  const reduced = useReducedMotion();
  const hours = dayScheduleHours();
  const hourLocale = locale === "ar" ? "ar" : undefined;
  const gridHeight =
    (DAY_SCHEDULE_END_HOUR - DAY_SCHEDULE_START_HOUR) * DAY_SCHEDULE_PX_PER_HOUR;
  const containerVariants = useMemo(
    () => dayScheduleCardContainerVariants(reduced),
    [reduced],
  );
  const cardVariants = useMemo(
    () => dayScheduleCardVariants(reduced),
    [reduced],
  );

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
        <motion.div
          className="relative min-w-0 flex-1 rounded-md border border-[var(--admin-border)] bg-[var(--admin-canvas)]"
          style={{ height: gridHeight }}
          variants={containerVariants}
          initial="hidden"
          animate="show"
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
            <motion.p
              variants={cardVariants}
              className="absolute inset-0 flex items-center justify-center text-[13px] text-[var(--admin-muted)]"
            >
              {emptyLabel}
            </motion.p>
          ) : (
            blocks.map(({ reservation, lane, topPx, heightPx }) => {
              const style = statusBlockStyle(reservation.status);
              const gapRem = 0.4;
              const sidePadRem = 0.35;
              const gapsTotal = (laneCount - 1) * gapRem;
              const track = `100% - ${sidePadRem * 2}rem - ${gapsTotal}rem`;
              return (
                <motion.button
                  key={reservation.id}
                  type="button"
                  variants={cardVariants}
                  data-showreel-action="schedule-appointment"
                  data-reservation-id={reservation.id}
                  onClick={() => onPatientSelect?.(reservation)}
                  title={`${reservation.patient_name} · ${reservation.service_label}`}
                  className="absolute flex flex-col justify-center overflow-hidden rounded-lg border px-2.5 py-1.5 text-start hover:opacity-90"
                  style={{
                    top: topPx,
                    height: Math.max(heightPx - 2, 36),
                    insetInlineStart: `calc(${sidePadRem}rem + ${lane} * ((${track}) / ${laneCount} + ${gapRem}rem))`,
                    width: `calc((${track}) / ${laneCount})`,
                    background: style.background,
                    borderColor: style.border,
                    color: style.color,
                  }}
                >
                  <p className="truncate text-[12px] font-semibold leading-snug">
                    <ReservationServiceLabel
                      serviceId={reservation.service_id}
                      storedLabel={reservation.service_label}
                      services={services}
                    />
                  </p>
                  <p className="mt-1 truncate text-[11px] leading-snug text-[var(--admin-muted)]">
                    {reservation.patient_name}
                  </p>
                </motion.button>
              );
            })
          )}
        </motion.div>
      </div>
    </div>
  );
}
