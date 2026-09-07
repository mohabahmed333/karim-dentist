"use client";

import { cn } from "@/lib/utils";

export type BookingDateOption = {
  value: string;
  label: string;
  weekday: string;
  day: string;
  hasOpen: boolean;
};

export type BookingSlotOption = {
  id: string;
  starts_at: string;
  status: "open" | "booked";
};

type Props = {
  dates: BookingDateOption[];
  selectedDate: string;
  onSelectDate: (value: string) => void;
  daySlots: BookingSlotOption[];
  selectedSlotId: string;
  onSelectSlot: (id: string) => void;
  slotsLoading: boolean;
  labels: {
    date: string;
    time: string;
    hint: string;
    loading: string;
    noDates: string;
    pickDate: string;
    noTimes: string;
    taken: string;
    full: string;
  };
  locale: string;
};

export function BookingSchedulePicker({
  dates,
  selectedDate,
  onSelectDate,
  daySlots,
  selectedSlotId,
  onSelectSlot,
  slotsLoading,
  labels,
  locale,
}: Props) {
  return (
    <div className="space-y-5 rounded-[16px] border border-[#e6e8ec] bg-[#fafbfc] p-4 sm:p-5">
      <div className="space-y-3">
        <p className="text-sm font-medium text-[#0f2744]">{labels.date}</p>
        {slotsLoading ? (
          <p className="text-sm text-[#6b7280]">{labels.loading}</p>
        ) : dates.length === 0 ? (
          <p className="text-sm text-[#6b7280]">{labels.noDates}</p>
        ) : (
          <div
            className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="listbox"
            aria-label={labels.date}
          >
            {dates.map((date) => {
              const selected = selectedDate === date.value;
              const full = !date.hasOpen;
              return (
                <button
                  key={date.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  aria-disabled={full}
                  title={full ? labels.full : date.label}
                  onClick={() => {
                    if (!full) onSelectDate(date.value);
                  }}
                  className={cn(
                    "flex min-w-[4.5rem] shrink-0 flex-col items-center gap-0.5 rounded-[12px] border px-3 py-2.5 text-center transition-colors",
                    full &&
                      "cursor-not-allowed border-[#eceff3] bg-[#f3f4f6] text-[#9aa3af]",
                    !full &&
                      selected &&
                      "border-[#0f2744] bg-[#0f2744] text-white",
                    !full &&
                      !selected &&
                      "border-[#e6e8ec] bg-white text-[#0f2744] hover:border-[#0f2744]/40",
                  )}
                >
                  <span className="text-[10px] font-medium uppercase tracking-[0.12em] opacity-80">
                    {date.weekday}
                  </span>
                  <span className="text-base font-semibold leading-none">
                    {date.day}
                  </span>
                  {full ? (
                    <span className="text-[9px] font-medium uppercase tracking-wide">
                      {labels.full}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-[#e6e8ec] pt-4">
        <div>
          <p className="text-sm font-medium text-[#0f2744]">{labels.time}</p>
          <p className="mt-1 text-xs text-[#6b7280]">{labels.hint}</p>
        </div>
        <div
          className="grid grid-cols-3 gap-2 sm:grid-cols-4"
          role="radiogroup"
          aria-label={labels.time}
        >
          {!selectedDate ? (
            <p className="col-span-full text-sm text-[#6b7280]">{labels.pickDate}</p>
          ) : daySlots.length === 0 ? (
            <p className="col-span-full text-sm text-[#6b7280]">{labels.noTimes}</p>
          ) : (
            daySlots.map((slot) => {
              const label = new Date(slot.starts_at).toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              });
              const taken = slot.status === "booked";
              const selected = !taken && selectedSlotId === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-disabled={taken}
                  disabled={taken}
                  onClick={() => {
                    if (!taken) onSelectSlot(slot.id);
                  }}
                  className={cn(
                    "rounded-[12px] border px-3 py-2.5 text-sm font-medium transition-colors",
                    taken &&
                      "cursor-not-allowed border-[#eceff3] bg-[#f3f4f6] text-[#9aa3af] line-through",
                    selected &&
                      "border-[#0f2744] bg-[#0f2744] text-white",
                    !taken &&
                      !selected &&
                      "border-[#e6e8ec] bg-white text-[#0f2744] hover:border-[#0f2744]/40",
                  )}
                >
                  {taken ? labels.taken : label}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
