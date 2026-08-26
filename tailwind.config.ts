import type { Config } from "tailwindcss";

/**
 * Palet diambil langsung dari logo resmi Aston Cirebon Hotel & Convention Center:
 *   Navy  #00205B  → warna utama ("ASTON")
 *   Perak #939598  → warna pendamping ("CIREBON" & tagline)
 * Emas hanya dipakai tipis sebagai penanda "perlu perhatian" (warna korporat Aston).
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
          50: "#EDF0F6",
          100: "#D3DAE9",
          200: "#A3B0CD",
          300: "#6E80AC",
          400: "#40558C",
          500: "#1B3570",
          600: "#08265F",
          700: "#00205B", // navy logo Aston
          800: "#001845",
          900: "#00102E",
        },
        silver: {
          50: "#F5F6F7",
          100: "#E8E9EB",
          200: "#D2D4D7",
          300: "#B9BBBF",
          400: "#A6A8AC",
          500: "#939598", // perak logo Aston
          600: "#76787C",
          700: "#5B5D61",
          800: "#414346",
          900: "#2B2C2F",
        },
        gold: {
          50: "#FCF7EE",
          100: "#F8EAD4",
          200: "#F0D5A9",
          300: "#E6BC7C",
          400: "#DDA75D",
          500: "#D6964A",
          600: "#B77C34",
          700: "#93622A",
          800: "#6C4820",
        },
        ink: {
          DEFAULT: "#101A2E",
          2: "#4A5670",
          3: "#7C879E",
        },
        line: "#DDE1E8",
        ground: "#F0F2F6",
      },
      fontFamily: {
        // Jost = grotesk geometris bergaya Futura, paling dekat dengan huruf pada logo Aston
        sans: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ['"Jost"', '"Century Gothic"', "Futura", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        brand: "0.22em",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,26,46,.06), 0 6px 18px rgba(16,26,46,.05)",
        lift: "0 2px 4px rgba(16,26,46,.06), 0 12px 28px rgba(16,26,46,.10)",
        navy: "0 8px 26px rgba(0,32,91,.24)",
        soft: "0 6px 20px rgba(0,32,91,.10)",
      },
      backgroundImage: {
        "navy-sheen": "linear-gradient(135deg, #00205B 0%, #08265F 45%, #001845 100%)",
        "silver-line": "linear-gradient(90deg, #00205B 0%, #939598 100%)",
      },
      keyframes: {
        fadeUp: { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "none" } },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideIn: { from: { opacity: "0", transform: "translateX(14px)" }, to: { opacity: "1", transform: "none" } },
        shimmer: { from: { backgroundPosition: "-480px 0" }, to: { backgroundPosition: "480px 0" } },
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(0,32,91,.35)" },
          "70%": { boxShadow: "0 0 0 12px rgba(0,32,91,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(0,32,91,0)" },
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
