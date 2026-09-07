"use client";

import { useMemo, useState } from "react";
import { Calendar, X } from "lucide-react";
import { RescheduleCalendar } from "./RescheduleCalendar";
import {
  buildReschedulePresets,
  clinicTimesForDay,
  combineDateTime,
  formatChipDate,
  sameDay,
} from "./rescheduleDateModel";

type Props = {
  open: boolean;
  pending?: boolean;
  currentStartsAt?: string | null;
  busyStartsAt?: string[];
  onClose: () => void;
  onConfirm: (startsAtIso: string) => void;
};

export function RescheduleDatePopover({
  open,
  pending,
  currentStartsAt,
  busyStartsAt = [],
  onClose,
  onConfirm,
}: Props) {
  const initial = currentStartsAt ? new Date(currentStartsAt) : new Date();
  const [view, setView] = useState(
    () => new Date(initial.getFullYear(), initial.getMonth(), 1),
  );
  const [selected, setSelected] = useState<Date | null>(() =>
    currentStartsAt ? new Date(currentStartsAt) : null,
  );
  const [time, setTime] = useState<string | null>(
    currentStartsAt
      ? `${String(initial.getHours()).padStart(2, "0")}:${String(initial.getMinutes()).padStart(2, "0")}`
      : null,
  );
  const [showTimes, setShowTimes] = useState(Boolean(currentStartsAt));

  const presets = useMemo(() => buildReschedulePresets(), []);
  const times = clinicTimesForDay();
  const busy = useMemo(() => {
    const keys = new Set<string>();
    for (const iso of busyStartsAt) {
      const d = new Date(iso);
      keys.add(
        `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`,
      );
    }
    return keys;
  }, [busyStartsAt]);

  if (!open) return null;

  function pickDay(day: Date) {
    setSelected(day);
    setView(new Date(day.getFullYear(), day.getMonth(), 1));
    setShowTimes(true);
    if (!time) setTime("10:00");
  }

  function apply() {
    if (!selected || !time) return;
    onConfirm(combineDateTime(selected, time));
  }

  return (
    <div className="absolute inset-x-3 bottom-[58px] z-40 overflow-hidden rounded-xl border border-[#D1D5DB] bg-white shadow-[0_8px_24px_rgba(17,17,17,0.14),0_24px_56px_rgba(17,17,17,0.2)]">
      <div className="border-b border-[#E8EAED] px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#E8EAED] bg-[#F8F9FB] px-2.5 py-1.5 text-[12px] text-[#111111]">
          <Calendar className="size-3.5 shrink-0 text-[#70758A]" />
          <span className="min-w-0 flex-1 truncate font-medium">
            {selected ? formatChipDate(selected) : "Pick a date"}
          </span>
          {selected ? (
            <button
              type="button"
              aria-label="Clear date"
              onClick={() => {
                setSelected(null);
                setTime(null);
                setShowTimes(false);
              }}
              className="text-[#9CA3AF] hover:text-[#111111]"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (!selected) return;
              setShowTimes(true);
            }}
            className="shrink-0 font-medium text-[#70758A] hover:text-[#111111]"
          >
            {time ?? "Add time"}
          </button>
        </div>
      </div>

      <div className="flex max-h-[340px] min-h-0">
        <ul className="w-[148px] shrink-0 overflow-y-auto border-e border-[#E8EAED] py-1">
          {presets.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  pickDay(p.date);
                  if (p.time) setTime(p.time);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-start text-[12px] ${
                  selected && sameDay(selected, p.date)
                    ? "bg-[#F1F3F5] font-semibold text-[#111111]"
                    : "text-[#111111] hover:bg-[#F8F9FB]"
                }`}
              >
                <span>{p.label}</span>
                <span className="text-[#9CA3AF]">{p.hint}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="min-w-0 flex-1 overflow-y-auto">
          <RescheduleCalendar
            view={view}
            selected={selected}
            onView={setView}
            onSelect={pickDay}
          />
          {showTimes && selected ? (
            <div className="border-t border-[#E8EAED] px-3 py-2.5">
              <p className="mb-2 text-[11px] font-medium text-[#70758A]">
                Available times
              </p>
              <div className="flex flex-wrap gap-1.5">
                {times.map((t) => {
                  const [h, m] = t.split(":").map(Number);
                  const key = `${selected.getFullYear()}-${selected.getMonth()}-${selected.getDate()}-${h}:${String(m).padStart(2, "0")}`;
                  const taken = busy.has(key);
                  const active = time === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={taken}
                      onClick={() => setTime(t)}
                      className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold ${
                        active
                          ? "border-[#111111] bg-[#111111] text-white"
                          : taken
                            ? "border-[#E8EAED] text-[#C5C9D2] line-through"
                            : "border-[#E8EAED] text-[#111111] hover:border-[#C5C9D2]"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-[#E8EAED] bg-white px-3 py-2.5">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#70758A] hover:bg-[#F8F9FB] hover:text-[#111111]"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={pending || !selected || !time}
          onClick={apply}
          className="rounded-lg bg-[#111111] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40"
        >
          {pending ? "Saving…" : "Confirm"}
        </button>
      </div>
    </div>
  );
}
