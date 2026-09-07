"use client";

const COLUMNS = [7, 11, 6, 10, 8];
const DAYS = ["M", "T", "W", "T", "F"];

export function VitalityDotChart() {
  return (
    <div className="mt-4 px-1" aria-hidden>
      <div className="flex items-end justify-between gap-2">
        {COLUMNS.map((filled, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex flex-col-reverse gap-1.5">
              {Array.from({ length: 11 }, (_, row) => (
                <span
                  key={row}
                  className={
                    row < filled
                      ? index % 2 === 0
                        ? "block size-1.5 rounded-full bg-[#E2F163]"
                        : "block size-1.5 rounded-full bg-white"
                      : "block size-1.5 rounded-full bg-white/20"
                  }
                />
              ))}
            </div>
            <span className="text-[9px] text-white/45">{DAYS[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
