import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { Cairo, Instrument_Serif, Inter } from "next/font/google";
import { RouteScrollToTop } from "@/features/portfolio";
import { HomeHashScroll } from "@/features/portfolio/components/HomeHashScroll";
import { LocaleProvider } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { LocaleBootstrapScript } from "@/lib/i18n/LocaleBootstrapScript";
import {
  LOCALE_COOKIE_KEY,
  localeDir,
  parseLocale,
} from "@/lib/i18n/localeStorage";
import "./globals.css";
import { cn } from "@/lib/utils";

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

const SITE_TITLE = "The Dental Lounge | Dr. Karim Elshibiny";
const SITE_DESCRIPTION =
  "The Dental Lounge by Dr. Karim Elshibiny offers modern laser and cosmetic dentistry with comfort-first care in New Cairo.";

export const metadata: Metadata = {
  // Required for relative canonical/OG URLs to resolve. Without it, any
  // relative URL in a metadata field is a build error.
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_TITLE,
    template: "%s — The Dental Lounge",
  },
  description: SITE_DESCRIPTION,
  // No `icons` override: app/favicon.ico and app/icon.png win via the file
  // convention. The previous override pointed every icon slot at a 297 KB
  // Instagram JPEG, which is not a valid favicon or apple-touch icon.
  openGraph: {
    type: "website",
    siteName: "The Dental Lounge",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
    alternateLocale: ["ar_EG"],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export function generateViewport(): Viewport {
  return { themeColor: "#0f2744" };
}

export default async function RootLayout({
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
          <HomeHashScroll />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
