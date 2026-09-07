"use client";

type Props = {
  status: string;
  disabled: boolean;
  onClick: () => void;
  label: string;
  fill: string;
};

export function SurfacePaintCell({
  status,
  disabled,
  onClick,
  label,
  fill,
}: Props) {
  const unmarked = status === "unmarked";
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      onClick={onClick}
      className="h-2.5 w-3 rounded-full border border-white/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] disabled:cursor-not-allowed"
      style={{
        background: unmarked ? "rgba(255,255,255,0.35)" : fill,
        boxShadow: unmarked
          ? "inset 0 1px 1px rgba(255,255,255,0.75), 0 0 0 1px rgba(148,163,184,0.35)"
          : `inset 0 1px 1px rgba(255,255,255,0.45), 0 0 0 1px ${fill}`,
      }}
    />
  );
}
