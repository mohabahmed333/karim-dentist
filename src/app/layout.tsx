import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Cairo, Instrument_Serif, Inter } from "next/font/google";
import { RouteScrollToTop } from "@/features/portfolio";
import { HomeHashScroll } from "@/features/portfolio/components/HomeHashScroll";
import { LocaleProvider } from "@/lib/i18n";
import {
  LOCALE_BOOTSTRAP_SCRIPT,
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

export const metadata: Metadata = {
  title: {
    default: "The Dental Lounge | Dr. Karim Elshibiny",
    template: "%s — The Dental Lounge",
  },
  description:
    "The Dental Lounge by Dr. Karim Elshibiny offers modern laser and cosmetic dentistry with comfort-first care in New Cairo.",
  icons: {
    icon: "/dental/766800441_18084577118253727_1449914596899119909_n.jpg",
    shortcut: "/dental/766800441_18084577118253727_1449914596899119909_n.jpg",
    apple: "/dental/766800441_18084577118253727_1449914596899119909_n.jpg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale =
    parseLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value) ?? "en";
  const dir = localeDir(initialLocale);

  return (
    <html
      lang={initialLocale}
      dir={dir}
      suppressHydrationWarning
      className={cn(inter.variable, instrument.variable, cairo.variable)}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: LOCALE_BOOTSTRAP_SCRIPT }}
        />
      </head>
      <body
        className={cn(
          "bg-white font-sans text-[#0f2744] antialiased",
          initialLocale === "ar" &&
            "font-[family-name:var(--font-arabic)]",
        )}
      >
        <LocaleProvider initialLocale={initialLocale}>
          <RouteScrollToTop />
          <HomeHashScroll />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
