import { BrandLogo } from "./BrandLogo";

type Props = {
  brand: string;
  brandLogo?: string | null;
  onNavigate: (href: string) => void;
};

export function NavDrawerBrand({ brand, brandLogo, onNavigate }: Props) {
  return (
    <div className="nav-drawer-brand">
      <button
        type="button"
        className="nav-drawer-brand-home"
        onClick={() => onNavigate("/")}
        aria-label={`${brand} home`}
      >
        <BrandLogo
          brand={brand}
          logoUrl={brandLogo}
          className="nav-drawer-brand-logo"
        />
      </button>
    </div>
  );
}
