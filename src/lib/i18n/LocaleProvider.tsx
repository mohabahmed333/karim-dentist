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
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const enCatalog: Record<string, string> = { ...en, ...adminEn };
const arCatalog: Record<string, string> = { ...ar, ...adminAr };

type Props = {
  children: React.ReactNode;
  initialLocale?: Locale;
};

export function LocaleProvider({
  children,
  initialLocale = "en",
}: Props) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Migrate older localStorage-only preference into cookie + state once.
  useEffect(() => {
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
  }, [initialLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDir(locale);
    document.body.classList.toggle(
      "font-[family-name:var(--font-arabic)]",
      locale === "ar",
    );
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => {
        const catalog = locale === "ar" ? arCatalog : enCatalog;
        return catalog[key] ?? String(key);
      },
      dir: localeDir(locale),
    }),
    [locale, setLocale],
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
