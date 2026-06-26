import localFont from "next/font/local";

/**
 * Self-hosted (no runtime CDN). Type system:
 * - Satoshi — display/headlines (clean modern geometric grotesque, the calm
 *   premium-engineering register; deliberately not Aqua Safe's Clash Display).
 * - Hanken Grotesk — body (shared sibling DNA, humanist readability).
 * - Geist Mono — engineering figures (the contaminant-reduction %, byline data).
 */
export const satoshi = localFont({
  src: [
    { path: "./fonts/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Satoshi-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const hanken = localFont({
  src: "./fonts/HankenGrotesk-Variable.woff2",
  weight: "400 600",
  style: "normal",
  variable: "--font-hanken",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const geistMono = localFont({
  src: [
    { path: "./fonts/GeistMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/GeistMono-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});
