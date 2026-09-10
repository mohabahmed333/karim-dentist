import { notFound } from "next/navigation";
import type { Metadata, Viewport } from "next";
import { Cairo, Instrument_Serif, Inter } from "next/font/google";
import { RouteScrollToTop } from "@/features/portfolio";
import { HomeHashScroll } from "@/features/portfolio/components/HomeHashScroll";
import { LocaleProvider } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n/localePath";
import { localeDir } from "@/lib/i18n/localeStorage";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { buildAlternates } from "@/lib/seo/alternates";
import { buildClinicGraph } from "@/lib/seo/jsonLd";
import { JsonLd } from "@/lib/seo/JsonLdScript";
import { getCachedClinicHours } from "@/services/clinic_schedule/cached";
import { getCachedPortfolioData } from "@/services/portfolio/cached";
import "../../globals.css";
import { cn } from "@/lib/utils";

/**
 * Root layout for the public, locale-routed site: "/" (English, via the
 * proxy's "/" -> "/en" rewrite) and "/ar/*" (Arabic, matched directly).
 * The URL segment is authoritative for content language — see
 * LocaleProvider's `source="url"` mode and src/lib/i18n/publicRewrite.ts.
 *
 * This is a second root layout alongside app/(internal)/layout.tsx, legal
 * because there is no top-level app/layout.tsx and the two route groups
 * never produce the same URL.
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

const SITE_TITLE = "The Dental Lounge | Dr. Karim Elshibiny";
const SITE_DESCRIPTION =
  "The Dental Lounge by Dr. Karim Elshibiny offers modern laser and cosmetic dentistry with comfort-first care in New Cairo.";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const alternates = buildAlternates(locale, "/", getSiteUrl());

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: SITE_TITLE,
      template: "%s — The Dental Lounge",
    },
    description: SITE_DESCRIPTION,
    alternates,
    openGraph: {
      type: "website",
      siteName: "The Dental Lounge",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      url: alternates.canonical,
      locale: locale === "ar" ? "ar_EG" : "en_US",
      alternateLocale: [locale === "ar" ? "en_US" : "ar_EG"],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    },
  };
}

export function generateViewport(): Viewport {
  return { themeColor: "#0f2744" };
}

export default async function PublicRootLayout({
  children,
  params,
}: Props) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale;
  const dir = localeDir(locale);

  const [portfolio, hours] = await Promise.all([
    getCachedPortfolioData(),
    getCachedClinicHours(),
  ]);
  const graph = buildClinicGraph({
    locale,
    siteUrl: getSiteUrl(),
    settings: portfolio.settings,
    hours,
    services: portfolio.services,
  });

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={cn(inter.variable, instrument.variable, cairo.variable)}
    >
      <body
        className={cn(
          "bg-white font-sans text-[#0f2744] antialiased",
          locale === "ar" && "font-[family-name:var(--font-arabic)]",
        )}
      >
        <JsonLd graph={graph} />
        <LocaleProvider initialLocale={locale} source="url">
          <RouteScrollToTop />
          <HomeHashScroll />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
