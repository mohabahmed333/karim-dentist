import { cookies, headers } from "next/headers";
import { Cairo, Instrument_Serif, Inter } from "next/font/google";
import { RouteScrollToTop } from "@/features/portfolio";
import { LocaleProvider } from "@/lib/i18n";
import { LocaleBootstrapScript } from "@/lib/i18n/LocaleBootstrapScript";
import {
  LOCALE_COOKIE_KEY,
  localeDir,
  parseLocale,
} from "@/lib/i18n/localeStorage";
import "../globals.css";
import { cn } from "@/lib/utils";

/**
 * Root layout for everything NOT on the public locale-routed site: admin
 * (/admin/*), and the showreel sales-demo routes (/showreel, /showreel2,
 * /showreel/demo). These stay cookie-driven — there is no /admin/ar or
 * /showreel/ar, and the admin UI's own language switcher already works via
 * the cookie independently of the public URL locale.
 *
 * A second root layout is legal in the App Router as long as no top-level
 * app/layout.tsx exists (see app/(site)/[locale]/layout.tsx, the other
 * one) and the two never resolve to the same URL — route groups like
 * (internal) don't appear in the URL, so /admin and /showreel keep their
 * paths unchanged by this move.
 */

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const cairo = Cairo({
  variable: "--font-arabic",
  subsets: ["latin", "arabic"],
  weight: ["400", "600", "700"],
});

export default async function InternalRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isShowreelDemo = (await headers()).get("x-showreel-demo") === "1";
  const initialLocale = isShowreelDemo
    ? "en"
    : (parseLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value) ?? "en");
  const dir = localeDir(initialLocale);

  return (
    <html
      lang={initialLocale}
      dir={dir}
      suppressHydrationWarning
      className={cn(inter.variable, instrument.variable, cairo.variable)}
    >
      <body
        className={cn(
          "bg-white font-sans text-[#0f2744] antialiased",
          initialLocale === "ar" &&
            "font-[family-name:var(--font-arabic)]",
        )}
      >
        <LocaleBootstrapScript />
        <LocaleProvider initialLocale={initialLocale}>
          <RouteScrollToTop />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
