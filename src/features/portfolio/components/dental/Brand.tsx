import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { mediaSrc } from "@/features/portfolio/lib/mediaSrc";

type BrandProps = {
  name: string;
  logoUrl?: string | null;
  href?: string;
  className?: string;
  ariaLabel?: string;
  showLogo?: boolean;
};

export function Brand({
  name,
  logoUrl,
  href = "#home",
  className,
  ariaLabel,
  showLogo = true,
}: BrandProps) {
  const logo = mediaSrc(logoUrl);

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-w-0 items-center gap-3 font-semibold text-[#0f2744]",
        className,
      )}
      aria-label={ariaLabel ?? name}
    >
      {showLogo && logo ? (
        <Image
          src={logo}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : null}
      <span className="truncate">{name}</span>
    </Link>
  );
}
