"use client";

type TabOption<T extends string> = {
  id: T;
  label: string;
};

type Props<T extends string> = {
  value: T;
  options: TabOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
};

/** Dense segmented tabs for Customize sidebars. */
export function EditorSegmentTabs<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: Props<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="grid gap-0.5 rounded-[6px] bg-[var(--admin-hover)] p-0.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={
              selected
                ? "h-7 rounded-[5px] bg-[var(--admin-primary)] text-[11px] font-medium text-white shadow-sm"
                : "h-7 rounded-[5px] text-[11px] font-medium text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
            }
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
