"use client";

type Props = {
  on: boolean;
  label: string;
  onToggle: () => void;
};

export function VisibilitySwitch({ on, label, onToggle }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? `Hide ${label}` : `Show ${label}`}
      onClick={onToggle}
      className={
        on
          ? "relative h-5 w-9 shrink-0 rounded-full bg-[#2f6fed] transition-colors"
          : "relative h-5 w-9 shrink-0 rounded-full bg-[#d4d4d4] transition-colors"
      }
    >
      <span
        className={
          on
            ? "absolute top-0.5 left-[18px] size-4 rounded-full bg-white shadow-sm transition-[left]"
            : "absolute top-0.5 start-0.5 size-4 rounded-full bg-white shadow-sm transition-[left]"
        }
      />
    </button>
  );
}
