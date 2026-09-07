"use client";

export type PatientProfileTab =
  | "information"
  | "history"
  | "next"
  | "medical";

const tabs: { id: PatientProfileTab; label: string }[] = [
  { id: "information", label: "Patient Information" },
  { id: "history", label: "Appointment History" },
  { id: "next", label: "Next Treatment" },
  { id: "medical", label: "Medical Record" },
];

type Props = {
  active: PatientProfileTab;
  onChange: (tab: PatientProfileTab) => void;
};

export function PatientProfileTabs({ active, onChange }: Props) {
  return (
    <div className="border-b border-[#e5e7eb]">
      <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Patient profile">
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={selected ? "page" : undefined}
              className={
                selected
                  ? "shrink-0 border-b-2 border-[#2563eb] pb-3 text-sm font-medium text-[#2563eb]"
                  : "shrink-0 border-b-2 border-transparent pb-3 text-sm font-medium text-[#6b7280] hover:text-[#111827]"
              }
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
