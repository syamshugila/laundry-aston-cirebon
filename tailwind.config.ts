import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF2FB",
          100: "#E3E9F8",
          200: "#C6D2F0",
          500: "#3B5BC0",
          600: "#2E4AA8",
          700: "#24408F",
          800: "#1C3271",
          900: "#152553",
        },
        ink: {
          DEFAULT: "#16212C",
          2: "#4E5F6E",
          3: "#7A8B98",
        },
        line: "#D5DEE5",
        ground: "#EDF1F4",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(22,33,44,.06), 0 6px 18px rgba(22,33,44,.05)",
      },
    },
  },
  plugins: [],
};

export default config;
