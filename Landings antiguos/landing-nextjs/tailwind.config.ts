import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // PME CAPECO design system – extraído de Stitch
        background: "#00132c",
        surface: "#00132c",
        "surface-dim": "#00132c",
        "surface-bright": "#223a5b",
        "surface-container-lowest": "#000e23",
        "surface-container-low": "#001c3b",
        "surface-container": "#03203f",
        "surface-container-high": "#112a4a",
        "surface-container-highest": "#1d3556",
        "surface-variant": "#1d3556",
        "on-background": "#d5e3ff",
        "on-surface": "#d5e3ff",
        "on-surface-variant": "#c3c6d7",
        primary: "#b4c5ff",
        "primary-container": "#2563eb",
        "primary-fixed": "#dbe1ff",
        "primary-fixed-dim": "#b4c5ff",
        "on-primary": "#002a78",
        "on-primary-container": "#eeefff",
        "on-primary-fixed": "#00174b",
        "on-primary-fixed-variant": "#003ea8",
        "inverse-primary": "#0053db",
        secondary: "#b0c8f0",
        "secondary-container": "#334a6c",
        "secondary-fixed": "#d5e3ff",
        "secondary-fixed-dim": "#b0c8f0",
        "on-secondary": "#183151",
        "on-secondary-container": "#a2bae1",
        "on-secondary-fixed": "#001c3b",
        "on-secondary-fixed-variant": "#304869",
        tertiary: "#ffb3ad",
        "tertiary-container": "#cf2c30",
        "tertiary-fixed": "#ffdad7",
        "tertiary-fixed-dim": "#ffb3ad",
        "on-tertiary": "#68000a",
        "on-tertiary-container": "#ffecea",
        "on-tertiary-fixed": "#410004",
        "on-tertiary-fixed-variant": "#930013",
        outline: "#8d90a0",
        "outline-variant": "#434655",
        error: "#ffb4ab",
        "error-container": "#93000a",
        "on-error": "#690005",
        "on-error-container": "#ffdad6",
        "inverse-surface": "#d5e3ff",
        "inverse-on-surface": "#183151",
        "surface-tint": "#b4c5ff",
      },
      fontFamily: {
        headline: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        sm: "0.125rem",
        md: "0.25rem",
        lg: "0.25rem",
        xl: "0.5rem",
        "2xl": "0.75rem",
        full: "0.75rem",
      },
      backgroundImage: {
        "blueprint-grid":
          "radial-gradient(rgba(37, 99, 235, 0.1) 1px, transparent 1px)",
        "primary-gradient":
          "linear-gradient(135deg, #2563eb 0%, #b4c5ff 100%)",
        "hero-gradient":
          "linear-gradient(to bottom right, #2563eb, #b4c5ff)",
      },
      backgroundSize: {
        blueprint: "40px 40px",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
