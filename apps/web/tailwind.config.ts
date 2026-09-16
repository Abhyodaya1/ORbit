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
        pixel: ['"Silkscreen"', 'monospace'], // Pixel arcade font for game chrome & badges
        sans: ['"Space Grotesk"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
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