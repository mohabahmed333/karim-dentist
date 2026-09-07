type Props = {
  brand: string;
  logoUrl?: string | null;
  className?: string;
};

export function BrandLogo({ brand, logoUrl, className }: Props) {
  const src = logoUrl?.trim() || null;
  if (!src) {
    if (className) return <span className={className}>{brand}</span>;
    return <>{brand}</>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={brand}
      className={className ?? "brand-logo"}
    />
  );
}
