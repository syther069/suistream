import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#131315",
        surface: "#131315",
        "surface-lowest": "#0e0e10",
        "surface-low": "#1c1b1d",
        "surface-container": "#201f22",
        "surface-high": "#2a2a2c",
        "surface-highest": "#353437",
        primary: "#a1c9ff",
        "primary-strong": "#4ca3ff",
        "on-primary": "#00315b",
        "on-surface": "#e5e1e4",
        "on-muted": "#c0c7d4",
        outline: "#8a919d",
        "outline-soft": "#404752",
        success: "#86efac",
        warning: "#fde68a",
        danger: "#ffb4ab"
      },
      fontFamily: {
        sans: ["var(--font-geist)", "Geist", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "SFMono-Regular"]
      },
      borderRadius: {
        sm: "0.125rem",
        DEFAULT: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem"
      },
      maxWidth: {
        container: "1200px"
      },
      boxShadow: {
        "primary-soft": "0 0 34px rgba(161, 201, 255, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
