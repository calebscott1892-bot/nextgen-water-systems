import type { Metadata, Viewport } from "next";
import "./globals.css";
import { satoshi, hanken, geistMono } from "./fonts";
import { SmoothScroll } from "@/lib/providers/SmoothScroll";
import { Cursor } from "@/components/Cursor";

const DESCRIPTION =
  "Premium whole-home water refining, engineered in Australia. Measurable contaminant reduction, award-winning design. Book a free in-home water test. (Concept demo — C4 Studios.)";

export const metadata: Metadata = {
  metadataBase: new URL("https://nextgenwatersystems.com.au"),
  title: {
    default: "Next Gen Water Systems — Premium home water refining",
    template: "%s | Next Gen Water Systems",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Next Gen Water Systems",
    title: "Next Gen Water Systems — Premium home water refining",
    description: DESCRIPTION,
  },
  robots: { index: false, follow: false }, // concept/demo — not for indexing yet
};

export const viewport: Viewport = {
  themeColor: "#05080c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" className={`${satoshi.variable} ${hanken.variable} ${geistMono.variable}`}>
      <body>
        <SmoothScroll>
          <Cursor />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
