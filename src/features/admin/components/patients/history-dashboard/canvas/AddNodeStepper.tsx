"use client";

const STEPS = ["Connect", "Shape", "Details"] as const;

type Props = {
  step: number;
};

export function AddNodeStepper({ step }: Props) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, index) => {
        const active = step === index;
        const done = step > index;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={`flex size-6 items-center justify-center rounded-full text-[10px] font-semibold ${
                  active
                    ? "bg-[#E2F163] text-[#111111]"
                    : done
                      ? "bg-[#111111] text-white"
                      : "bg-[#EBEAE5] text-[#111111]/45"
                }`}
              >
                {index + 1}
              </span>
              <span
                className={`text-[11px] font-medium ${
                  active ? "text-[#111111]" : "text-[#111111]/45"
                }`}
              >
                {label}
              </span>
            </div>
            {index < STEPS.length - 1 ? (
              <span className={`h-px flex-1 ${done ? "bg-[#111111]/30" : "bg-[#111111]/10"}`} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
