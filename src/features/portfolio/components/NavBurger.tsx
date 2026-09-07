type Props = {
  open: boolean;
  label?: string;
  className?: string;
  controls?: string;
  onClick: () => void;
};

export function NavBurger({
  open,
  label,
  className = "",
  controls,
  onClick,
}: Props) {
  const ariaLabel = label ?? (open ? "Close menu" : "Open menu");

  return (
    <button
      type="button"
      className={`nav-burger${className ? ` ${className}` : ""}`}
      aria-expanded={open}
      aria-controls={controls}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <span />
      <span />
      <span />
    </button>
  );
}
