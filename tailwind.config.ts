import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f8f8",
          100: "#e7f0f1",
          200: "#c6dcde",
          300: "#9bbec4",
          400: "#6b97a2",
          500: "#4f7d88",
          600: "#3f656e",
          700: "#35525a",
          800: "#30454b",
          900: "#2d3b40"
        },
        accent: "#b98a44"
      },
      boxShadow: {
        soft: "0 8px 30px rgba(31, 55, 67, 0.12)"
      },
      fontFamily: {
        heading: ["Iowan Old Style", "Palatino Linotype", "Book Antiqua", "serif"],
        body: ["Avenir Next", "Segoe UI", "Helvetica Neue", "sans-serif"]
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(circle at 10% 20%, rgba(79,125,136,0.23) 0%, rgba(255,255,255,0.96) 52%, rgba(185,138,68,0.18) 100%)"
      }
    }
  },
  plugins: []
};

export default config;
