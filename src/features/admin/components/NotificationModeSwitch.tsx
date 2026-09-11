"use client";

export type NotificationMode = "off" | "dry_run" | "send";

const OPTIONS: { value: NotificationMode; label: string; hint: string }[] = [
  { value: "off", label: "Off", hint: "Nothing is sent. New bookings still queue their messages." },
  { value: "dry_run", label: "Dry run", hint: "Messages are written but not sent — read them in Patient messages." },
  { value: "send", label: "Send", hint: "Patients receive their messages." },
];

type Props = {
  value: NotificationMode;
  onChange: (mode: NotificationMode) => void;
  /** Send is refused by the server while anything required is missing. */
  sendBlocked: boolean;
};

export function NotificationModeSwitch({ value, onChange, sendBlocked }: Props) {
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--admin-muted)]">Mode</p>
      <div
        role="radiogroup"
        aria-label="Patient notifications mode"
        className="grid grid-cols-3 gap-1 rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-canvas,#f7f7f8)] p-1"
      >
        {OPTIONS.map((option) => {
          const selected = option.value === value;
          const disabled = option.value === "send" && sendBlocked && !selected;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              title={disabled ? "Fix the items under “Fix these first” to enable sending" : undefined}
              onClick={() => onChange(option.value)}
              className={`h-8 rounded-md text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
                selected
                  ? "bg-[var(--admin-panel,#fff)] font-medium text-[var(--admin-text,#1a1a1a)] shadow-sm"
                  : "text-[var(--admin-muted)] hover:text-[var(--admin-text,#1a1a1a)]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs leading-relaxed text-[var(--admin-muted)]">
        {sendBlocked && value !== "send" ? "Send is locked until the items on the right are fixed. " : ""}
        {current.hint}
      </p>
    </div>
  );
}
