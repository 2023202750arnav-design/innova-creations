import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: "#C9A84C", light: "#E8D5A3", dark: "#9A7B2C" },
        cream: "#F5EDD8",
        ivory: "#FAF8F3",
        charcoal: "#1A1A1A",
        navy: "#0D1B2A",
        burgundy: "#5C1B33",
        mid: "#6B6B6B",
      },
      fontFamily: {
        display: ["Cormorant Garamond", "serif"],
        body: ["Jost", "sans-serif"],
        script: ["Great Vibes", "cursive"],
      },
      boxShadow: { gold: "0 24px 70px rgba(201,168,76,.28)" },
    },
  },
  plugins: [],
} satisfies Config;
