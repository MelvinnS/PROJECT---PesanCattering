import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: "#121212",
          50: "#f6f6f6",
          100: "#e7e7e7",
          200: "#d1d1d1",
          300: "#b0b0b0",
          400: "#888888",
          500: "#6d6d6d",
          600: "#5d5d5d",
          700: "#4f4f4f",
          800: "#222222",
          900: "#121212",
        },
        accent: {
          DEFAULT: "#F59E0B", // amber warm
          hover: "#D97706",
          light: "#FEF3C7",
          yellow: "#FBBF24",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F8F9FA",
          subtle: "#F1F3F5",
        },
      },
      borderRadius: {
        card: "24px",
        pill: "9999px",
      },
      fontSize: {
        xs: ["13px", "18px"],
        sm: ["15px", "22px"],
        base: ["18px", "26px"], // Aturan ramah lansia: dasar minimal 18px
        lg: ["20px", "28px"],
        xl: ["24px", "32px"],
        "2xl": ["28px", "36px"],
        "3xl": ["32px", "40px"],
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
        floating: "0 10px 30px -5px rgba(0, 0, 0, 0.12)",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
