"use client";

type Props = {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  danger?: boolean;
};

export function CollectionRowAction({
  children,
  label,
  onClick,
  disabled,
  active,
  danger,
}: Props) {
  const base =
    "inline-flex h-7 w-6 items-center justify-center rounded-[4px] text-[11px] disabled:opacity-25";
  const tone = danger
    ? active
      ? "text-white/80 hover:bg-white/15 hover:text-white"
      : "text-red-700 dark:text-red-400 hover:bg-[#b42318]/10"
    : active
      ? "text-white/75 hover:bg-white/15 hover:text-white"
      : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${tone}`}
    >
      {children}
    </button>
  );
}
