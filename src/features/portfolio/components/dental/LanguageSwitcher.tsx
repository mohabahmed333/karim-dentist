"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className={cn(
        "inline-flex gap-[0.15rem] rounded-full border border-[#e6e8ec] bg-[#f6f7f9] p-[0.2rem]",
        className,
      )}
      aria-label="Language switcher"
    >
      <button
        type="button"
        className={cn(
          "min-w-10 rounded-full px-[0.55rem] py-[0.4rem] text-[0.8rem] font-bold transition-colors",
          locale === "en"
            ? "bg-[#0f2744] text-white"
            : "bg-transparent text-[#6b7280] hover:text-[#0f2744]",
        )}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
      <button
        type="button"
        className={cn(
          "min-w-10 rounded-full px-[0.55rem] py-[0.4rem] text-[0.8rem] font-bold transition-colors",
          locale === "ar"
            ? "bg-[#0f2744] text-white"
            : "bg-transparent text-[#6b7280] hover:text-[#0f2744]",
        )}
        onClick={() => setLocale("ar")}
      >
        AR
      </button>
    </div>
  );
}
