import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Instrument Serif"', "ui-serif", "Georgia", "serif"],
        sans: ['"Geist"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        bg: "#0a0a0a",
        surface: "#131313",
        elevated: "#1a1a1a",
        border: "#262626",
        muted: "#737373",
        text: "#ededed",
        accent: "#d4a373",
        accent2: "#c9b18a",
        success: "#84cc16",
        warning: "#f59e0b",
        danger: "#dc2626",
        gold: "#d4a373",
      },
    },
  },
  plugins: [],
};
export default config;
