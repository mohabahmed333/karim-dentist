"use client";

export function ApexWaveform() {
  const d =
    "M0 22 C 6 22 8 10 14 22 S 24 38 32 22 S 46 2 56 22 S 70 40 80 22 S 94 6 104 22 S 118 36 128 22 S 142 8 152 22 S 162 28 168 22";
  return (
    <div className="overflow-hidden">
      <div className="hx-ecg flex w-[200%]">
        <svg viewBox="0 0 168 44" className="h-11 w-1/2" aria-hidden>
          <path d={d} fill="none" stroke="#f5f5f5" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <svg viewBox="0 0 168 44" className="h-11 w-1/2" aria-hidden>
          <path d={d} fill="none" stroke="#f5f5f5" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
