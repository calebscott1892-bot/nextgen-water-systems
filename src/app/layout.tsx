import type { Metadata, Viewport } from "next";
import "./globals.css";
import { satoshi, hanken, geistMono } from "./fonts";
import { SmoothScroll } from "@/lib/providers/SmoothScroll";
import { Cursor } from "@/components/Cursor";
import { asset } from "@/lib/asset";

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
      <head>
        {/* start the hero chrome's HDR env fetch at HTML parse — otherwise it
            waits for hydration → dynamic chunk → <Environment> mount. NO
            crossOrigin: the HDR is same-origin and THREE.FileLoader fetches it
            with same-origin credentials — a crossorigin="anonymous" preload
            mismatches and double-downloads (verified via the console warning). */}
        <link rel="preload" href={asset("/hdri/studio_small_03_1k.hdr")} as="fetch" />
        {/* Routed Gothic (SIL OFL — the digitised Leroy/drafting-template
            lettering; licence in public/fonts). Declared here with asset()
            because CSS url("/fonts/…") would skip the basePath and 404 on
            Pages — the known raw-absolute-URL gotcha. */}
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
@font-face{font-family:"Routed Gothic";src:url(${asset("/fonts/routed-gothic.ttf")}) format("truetype");font-display:swap}
@font-face{font-family:"Routed Gothic Wide";src:url(${asset("/fonts/routed-gothic-wide.ttf")}) format("truetype");font-display:swap}
@font-face{font-family:"Routed Gothic Narrow";src:url(${asset("/fonts/routed-gothic-narrow.ttf")}) format("truetype");font-display:swap}
@font-face{font-family:"Routed Gothic Half Italic";src:url(${asset("/fonts/routed-gothic-half-italic.ttf")}) format("truetype");font-display:swap}
:root{--font-draft:"Routed Gothic";--font-draft-wide:"Routed Gothic Wide";--font-draft-narrow:"Routed Gothic Narrow";--font-draft-note:"Routed Gothic Half Italic"}`,
          }}
        />
      </head>
      <body>
        <SmoothScroll>
          <Cursor />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
