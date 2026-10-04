import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        orbit: {
          bg: "#f4f3fb",           
          surface: "#ffffff",     
          subsurface: "#edeaf8",  
          border: "#2d264f",       // Tactile retro arcade border (deep cozy plum)
          borderMuted: "#d7d3ea",  // Subtle divider borders
          text: "#221c38",         // Deep soft plum text (gentle, high contrast)
          muted: "#757095",        // Soft secondary text
          accent: "#7c5ce7",       // Soothing neon violet
          mint: "#10b981",         // Refreshing matcha-mint (success / connected)
          coral: "#ff7675",        // Warm peach-coral (alert / accent)
          arcadeYellow: "#fdcb6e", 
        },
      },
      fontFamily: {
        pixel: ['"Silkscreen"', 'monospace'], // Pixel arcade display font
        sans: ['"Space Grotesk"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'], // Primary editorial body font
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'], // High-contrast telemetry font
      },
      fontSize: {
        // Paired font size, line-height, and tracking tokens (taste-skill + impeccable standard)
        "display-hero": [
          "clamp(2.5rem, 6.5vw, 4.5rem)",
          { lineHeight: "1.05", letterSpacing: "0.04em", fontWeight: "700" },
        ],
        "display-title": [
          "clamp(1.75rem, 4vw, 2.75rem)",
          { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "card-title": [
          "clamp(1.125rem, 2.2vw, 1.375rem)",
          { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        "pixel-base": ["0.875rem", { lineHeight: "1.35", letterSpacing: "0.05em" }],
        "pixel-sm": ["0.75rem", { lineHeight: "1.25", letterSpacing: "0.06em" }],
        "pixel-xs": ["0.6875rem", { lineHeight: "1.15", letterSpacing: "0.08em" }],
        "pixel-tag": ["0.5625rem", { lineHeight: "0.875rem", letterSpacing: "0.08em" }],
        "telemetry": ["0.6875rem", { lineHeight: "1.125rem", letterSpacing: "0.025em" }],
      },
      letterSpacing: {
        "pixel-snug": "0.02em",
        "pixel-normal": "0.05em",
        "pixel-wide": "0.08em",
        "pixel-widest": "0.12em",
        "brutal-tight": "-0.025em",
        "brutal-normal": "0em",
        "brutal-wide": "0.025em",
      },
      lineHeight: {
        "arcade-none": "1",
        "arcade-tight": "1.15",
        "arcade-snug": "1.25",
        "arcade-normal": "1.45",
        "arcade-relaxed": "1.65",
      },
      borderRadius: {
        boxy: "8px",
      },
      boxShadow: {
        // Authentic tactile arcade drop shadows (solid offset, no muddy blurs)
        arcade: "3px 3px 0px 0px #2d264f",
        arcadeLg: "5px 5px 0px 0px #2d264f",
        arcadeSm: "2px 2px 0px 0px #2d264f",
      },
    },
  },
  plugins: [],
};
export default config;