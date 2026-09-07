"use client";

import { useLocale } from "@/lib/i18n";

/**
 * Drawer docks on the reading-start edge flipped for admin UX:
 * English → left (closes left), Arabic → right (closes right).
 * `shellDir` stays LTR so justify-* / x% are physical, not logical.
 */
export function useAdminDrawerSide() {
  const { locale } = useLocale();
  const rtl = locale === "ar";
  return {
    rtl,
    shellDir: "ltr" as const,
    contentDir: (rtl ? "rtl" : "ltr") as "rtl" | "ltr",
    /** Off-screen exit (percentage of self width). */
    offscreenX: rtl ? "100%" : "-100%",
    shellClass: rtl ? "justify-end" : "justify-start",
    panelClass: rtl
      ? "border-s border-[var(--admin-border,#e6e6e6)] shadow-[-12px_0_40px_rgba(0,0,0,0.12)]"
      : "border-e border-[var(--admin-border,#e6e6e6)] shadow-[12px_0_40px_rgba(0,0,0,0.12)]",
  };
}
