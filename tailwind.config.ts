import type { Config } from "tailwindcss";

/**
 * Palet warna mengikuti identitas resmi Aston:
 *   Prussian Blue #001C5A  → warna utama (navy)
 *   Di Serria     #D6964A  → aksen emas
 *   Jordy Blue    #6BBAEF  → biru langit (pendukung)
 */
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
          50: "#EDF1F9",
          100: "#D5DFF1",
          200: "#A6BADF",
          300: "#7291C8",
          400: "#4468AB",
          500: "#22458A",
          600: "#0C2C6E",
          700: "#001C5A", // Prussian Blue — warna resmi Aston
          800: "#001444",
          900: "#000D2E",
        },
        gold: {
          50: "#FCF7EE",
          100: "#F8EAD4",
          200: "#F0D5A9",
          300: "#E6BC7C",
          400: "#DDA75D",
          500: "#D6964A", // Di Serria — warna resmi Aston
          600: "#B77C34",
          700: "#93622A",
          800: "#6C4820",
          900: "#472F15",
        },
        sky: {
          50: "#EFF8FE",
          100: "#DBEEFC",
          200: "#B6DDF8",
          300: "#8ECBF3",
          400: "#6BBAEF", // Jordy Blue — warna resmi Aston
          500: "#4A9FD8",
          600: "#357FB3",
          700: "#28618A",
        },
        ink: {
          DEFAULT: "#101A2E",
          2: "#4A5670",
          3: "#7C879E",
        },
        line: "#DCE1EC",
        ground: "#EFF2F7",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ['"Fraunces"', 'Georgia', "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,26,46,.06), 0 6px 18px rgba(16,26,46,.05)",
        lift: "0 2px 4px rgba(16,26,46,.06), 0 12px 28px rgba(16,26,46,.10)",
        gold: "0 6px 20px rgba(214,150,74,.28)",
        navy: "0 8px 26px rgba(0,28,90,.24)",
      },
      backgroundImage: {
        "navy-sheen": "linear-gradient(135deg, #001C5A 0%, #0C2C6E 48%, #001444 100%)",
        "gold-line": "linear-gradient(90deg, #D6964A 0%, #E6BC7C 50%, #D6964A 100%)",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "none" },
        },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideIn: {
          from: { opacity: "0", transform: "translateX(14px)" },
          to: { opacity: "1", transform: "none" },
        },
        shimmer: { from: { backgroundPosition: "-480px 0" }, to: { backgroundPosition: "480px 0" } },
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(214,150,74,.5)" },
          "70%": { boxShadow: "0 0 0 10px rgba(214,150,74,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(214,150,74,0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp .45s cubic-bezier(.22,.72,.28,1) both",
        fadeIn: "fadeIn .35s ease both",
        slideIn: "slideIn .3s cubic-bezier(.22,.72,.28,1) both",
        shimmer: "shimmer 1.4s linear infinite",
        pulseRing: "pulseRing 2s cubic-bezier(.22,.72,.28,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
