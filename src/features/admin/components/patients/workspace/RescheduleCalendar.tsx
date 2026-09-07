"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { monthMatrix, sameDay } from "./rescheduleDateModel";

type Props = {
  view: Date;
  selected: Date | null;
  onView: (month: Date) => void;
  onSelect: (day: Date) => void;
};

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function RescheduleCalendar({
  view,
  selected,
  onView,
  onSelect,
}: Props) {
  const rows = monthMatrix(view);
  const label = view.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-w-[240px] flex-1 p-3">
      <div className="mb-2 flex items-center gap-2">
        <p className="flex-1 text-[13px] font-semibold text-[#111111]">{label}</p>
        <button
          type="button"
          className="text-[12px] font-medium text-[#70758A] hover:text-[#111111]"
          onClick={() => onView(new Date())}
        >
          Today
        </button>
        <button
          type="button"
          aria-label="Previous month"
          className="rounded p-0.5 text-[#70758A] hover:bg-[#F1F3F5]"
          onClick={() =>
            onView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
          }
        >
          <ChevronUp className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Next month"
          className="rounded p-0.5 text-[#70758A] hover:bg-[#F1F3F5]"
          onClick={() =>
            onView(new Date(view.getFullYear(), view.getMonth() + 1, 1))
          }
        >
          <ChevronDown className="size-4" />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {DOW.map((d) => (
          <span
            key={d}
            className="py-1 text-center text-[10px] font-medium text-[#9CA3AF]"
          >
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {rows.flat().map((day) => {
          const inMonth = day.getMonth() === view.getMonth();
          const active = selected ? sameDay(day, selected) : false;
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect(day)}
              className={`h-8 rounded-md text-[12px] font-medium ${
                active
                  ? "bg-[#111111] text-white"
                  : inMonth
                    ? "text-[#111111] hover:bg-[#F1F3F5]"
                    : "text-[#C5C9D2] hover:bg-[#F1F3F5]"
              }`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
