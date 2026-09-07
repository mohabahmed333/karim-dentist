import { XIcon } from "lucide-react";

type Props = {
  className?: string;
  label?: string;
  onClick: () => void;
};

export function NavMenuClose({
  className = "",
  label = "Close menu",
  onClick,
}: Props) {
  return (
    <button
      type="button"
      className={`nav-menu-close${className ? ` ${className}` : ""}`}
      aria-label={label}
      onClick={onClick}
    >
      <XIcon aria-hidden />
    </button>
  );
}
