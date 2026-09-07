type Props = {
  ratio: number;
  label: string;
  unavailable?: boolean;
};

export function UsageDonut({ ratio, label, unavailable = false }: Props) {
  const percent = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  const usedDeg = unavailable ? 0 : percent * 3.6;
  return (
    <div
      role="img"
      aria-label={label}
      className="relative size-28 shrink-0 rounded-full"
      style={{
        background: `conic-gradient(var(--admin-primary) ${usedDeg}deg, #ECEEF3 0deg)`,
      }}
    >
      <div className="absolute inset-[0.55rem] flex items-center justify-center rounded-full bg-white text-sm font-semibold text-[var(--admin-text)]">
        {unavailable ? "—" : `${percent}%`}
      </div>
    </div>
  );
}
