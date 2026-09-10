"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import { mirrorPath } from "@/lib/i18n/localePath";

/**
 * On the public site (source="url") this must render real, followable
 * links — crawlers discover /ar by following them, not by executing a
 * click handler. On admin (source="cookie", e.g. the login form) there is
 * no /admin/ar, so it stays a same-page toggle via setLocale.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, source } = useLocale();
  const pathname = usePathname();

  const optionClass = (active: boolean) =>
    cn(
      "min-w-10 rounded-full px-[0.55rem] py-[0.4rem] text-center text-[0.8rem] font-bold transition-colors",
      active
        ? "bg-[#0f2744] text-white"
        : "bg-transparent text-[#6b7280] hover:text-[#0f2744]",
    );

  return (
    <div
      className={cn(
        "inline-flex gap-[0.15rem] rounded-full border border-[#e6e8ec] bg-[#f6f7f9] p-[0.2rem]",
        className,
      )}
      aria-label="Language switcher"
    >
      {source === "url" ? (
        <>
          <Link
            href={mirrorPath(pathname, "en")}
            hrefLang="en"
            className={optionClass(locale === "en")}
          >
            EN
          </Link>
          <Link
            href={mirrorPath(pathname, "ar")}
            hrefLang="ar"
            className={optionClass(locale === "ar")}
          >
            AR
          </Link>
        </>
      ) : (
        <>
          <button
            type="button"
            className={optionClass(locale === "en")}
            onClick={() => setLocale("en")}
          >
            EN
          </button>
          <button
            type="button"
            className={optionClass(locale === "ar")}
            onClick={() => setLocale("ar")}
          >
            AR
          </button>
        </>
      )}
    </div>
  );
}
