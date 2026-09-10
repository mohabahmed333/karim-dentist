type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export function ProductSceneChrome({
  title,
  subtitle,
  children,
  className = "",
}: Props) {
  return (
    <div
      className={`showreel-product-chrome min-h-screen bg-[#f7f8f8] text-[#1a1a1a] ${className}`}
    >
      <header className="flex items-center justify-between border-b border-[#e6e6e6] bg-white px-5 py-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.14em] text-[#6b6f76] uppercase">
            Dental Lounge · Admin
          </p>
          <h1 className="text-[15px] font-semibold text-[#1a1a1a]">{title}</h1>
        </div>
        {subtitle ? (
          <span className="rounded-md bg-[#5e6ad2]/12 px-2.5 py-1 text-[11px] font-medium text-[#5e6ad2]">
            {subtitle}
          </span>
        ) : null}
      </header>
      <div className="p-5">{children}</div>
    </div>
  );
}
