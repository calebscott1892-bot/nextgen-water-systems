import type { Config } from "tailwindcss";

/** Tokens live as CSS variables in src/app/globals.css (:root) — single source of truth. */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "var(--void)",
        surface: "var(--surface)",
        ice: "var(--ice)",
        cyan: "var(--cyan)",
        deep: "var(--deep)",
        steel: "var(--steel)",
        muted: "var(--muted)",
        line: "var(--line)",
      },
      fontFamily: {
        display: ["var(--font-satoshi)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-hanken)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: { wrap: "var(--maxw)" },
      transitionTimingFunction: { fluid: "var(--ease)" },
      spacing: {
        // 8pt-based vertical rhythm
        section: "clamp(112px, 14vh, 200px)",
        gutter: "clamp(20px, 4vw, 40px)",
      },
    },
  },
  plugins: [],
};

export default config;
