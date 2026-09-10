"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ar } from "./messages/ar";
import { en, type MessageKey } from "./messages/en";
import { adminAr } from "./messages/admin/ar";
import { adminEn, type AdminMessageKey } from "./messages/admin/en";
import {
  isShowreelDemoLocaleLock,
  localeDir,
  parseLocale,
  persistLocale,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "./localeStorage";

export type { Locale };
export type AnyMessageKey = MessageKey | AdminMessageKey;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: AnyMessageKey) => string;
  dir: "ltr" | "rtl";
  /** "url" on the public site (LanguageSwitcher must navigate, not just set
   * state); "cookie" everywhere else (admin login can switch in place). */
  source: "cookie" | "url";
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const enCatalog: Record<string, string> = { ...en, ...adminEn };
const arCatalog: Record<string, string> = { ...ar, ...adminAr };

type Props = {
  children: React.ReactNode;
  initialLocale?: Locale;
  /**
   * "cookie" (default): admin + showreel — locale can change without
   * navigation, migrates an older localStorage preference into state on
   * mount, and mutates document.documentElement client-side.
   *
   * "url": the public site. The route segment ("/" vs "/ar") is the only
   * source of truth for content language, so this provider must never
   * silently show Arabic at an English URL (or vice versa) just because a
   * cookie or localStorage says otherwise:
   *  - no localStorage migration on mount,
   *  - no client-side document.documentElement mutation (SSR already
   *    emitted the correct lang/dir for this URL),
   *  - setLocale() only persists a cookie hint for a later admin visit; it
   *    does not change what's rendered. Actually changing language means
   *    navigating to the mirrored URL (see LanguageSwitcher).
   */
  source?: "cookie" | "url";
};

export function LocaleProvider({
  children,
  initialLocale = "en",
  source = "cookie",
}: Props) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Migrate older localStorage-only preference into cookie + state once.
  useEffect(() => {
    if (source !== "cookie") return;
    if (isShowreelDemoLocaleLock()) {
      setLocaleState("en");
      return;
    }
    try {
      const stored = parseLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
      if (stored && stored !== initialLocale) {
        setLocaleState(stored);
        persistLocale(stored);
        return;
      }
      persistLocale(initialLocale);
    } catch {
      persistLocale(initialLocale);
    }
  }, [initialLocale, source]);

  useEffect(() => {
    if (source !== "cookie") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDir(locale);
    document.body.classList.toggle(
      "font-[family-name:var(--font-arabic)]",
      locale === "ar",
    );
  }, [locale, source]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (source === "url") {
        persistLocale(next);
        return;
      }
      setLocaleState(next);
      persistLocale(next);
    },
    [source],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => {
        const catalog = locale === "ar" ? arCatalog : enCatalog;
        return catalog[key] ?? String(key);
      },
      dir: localeDir(locale),
      source,
    }),
    [locale, setLocale, source],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useTranslations() {
  return useLocale().t;
}
